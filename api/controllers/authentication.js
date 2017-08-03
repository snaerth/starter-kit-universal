import crypto from 'crypto';
import { validateEmail, isIcelandicPhoneNumber } from '../utils/validate';
import sendMail from '../services/mailService';
import log from '../services/logService';
import {
  tokenForUser,
  updateUserPassword,
  checkUserByEmail,
  saveUser,
  attachTokenToUser,
} from './users';
import User from '../models/user';
import config from '../config';

// VARIABLES
const { PORT, HOST, PROTOCOL } = config;
const applicationUrl = `${PROTOCOL}://${HOST}:${PORT}`;

/**
 * Removes properties from mongoose user schema object
 *
 * @param {Object} user - Mongoose user schema object
 * @param {Array} moreProps - Array of strings to remove from user object
 * @returns {Object} newUser
 */
export function removeUserProps(user, moreProps) {
  let delProps = ['__v', '_id', 'createdAt', 'password'];
  delProps = moreProps && moreProps.length
    ? delProps.concat(moreProps)
    : delProps;
  const newUser = user.toObject();

  for (let i = 0; i < delProps.length; i++) {
    const hasBarProperty = Object.prototype.hasOwnProperty.call(
      newUser,
      delProps[i],
    );

    if (hasBarProperty) {
      delete newUser[delProps[i]];
    }
  }

  return newUser;
}

/**
 * Success social handler
 * Sets user cookie and expire time and then redirects to
 * Application profile page
 *
 * @param {Object} req
 * @param {Object} res
 * @returns res
 */
export function successSocialCallback(req, res) {
  const { user } = req;
  if (user) {
    let newUser = new User(user);
    newUser = removeUserProps(newUser);
    // Store user and jwt token in a cookie
    res.cookie('user', {
      token: tokenForUser(newUser),
      ...newUser,
    });

    const expireTime = 30 * 24 * 60 * 1000; // 30 days
    res.cookie('userExpires', new Date(Date.now() + expireTime));

    return res.status(200).redirect(`${applicationUrl}/profile`);
  }

  return res.status(401).send('Access denied');
}

/**
 * Error social handler
 *
 * @param {Object} err
 * @param {Object} req
 * @param {Object} res
 * @returns res
 */
// eslint-disable-next-line
export function errorSocialCallback(err, req, res, next) {
  let error = "Couldn't create user";
  if (err.code === 11000) {
    log.error({ req, res, err: new Error(error) }, 'Email already in use');
    error = 'Email already in use';
  }
  // TODO - log error

  return res.status(401).redirect(`${applicationUrl}/signin?error=${error}`);
}

/**
 * Signs user out, destorys session and clear cookies
 *
 * @param {Object} req
 * @param {Object} res
 * @returns res
 */
export function signOut(req, res) {
  req.logout();
  res.clearCookie('user');
  res.clearCookie('userExpires');
  req.session.destroy((error) => {
    if (error) {
      log.error(
        { req, res, err: new Error(error) },
        'Error destroying request session',
      );

      return res.status(500).send({ error });
    }

    return res.status(200).send('User signed out');
  });
}

/**
 * Validates email, password, name, dateOfBirth or phone
 * If error then return error string
 *
 * @param {String} email
 * @param {String} password
 * @param {String} newPassword
 * @param {String} name
 * @param {String} dateOfBirth
 * @param {String} phone
 * @returns {String} error
 * @author Snær Seljan Þóroddsson
 */
export function validateSignup({
  email,
  password,
  newPassword,
  name,
  dateOfBirth,
  phone,
}) {
  // Check if email, password or message exist in request
  if (!email || !password || !name) {
    return 'You must provide name, email and password';
  }
  // Validate email
  if (!validateEmail(email)) {
    return `${email} is not a valid email`;
  }

  // Check if password length is longer then 6 characters
  if (password.length < 6) {
    return 'Password must be of minimum length 6 characters';
  }
  // Check if password contains one number and one uppercase letter
  if (!/[0-9]/.test(password) || !/[A-Z]/.test(password)) {
    return 'Password must contain at least one number (0-9) and one uppercase letter (A-Z)';
  }

  if (newPassword) {
    // Check if password length is longer then 6 characters
    if (newPassword.length < 6) {
      return 'New password must be of minimum length 6 characters';
    }
    // Check if password contains one number and one uppercase letter
    if (!/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      return 'New password must contain at least one number (0-9) and one uppercase letter (A-Z)';
    }
  }

  // Name has to have aleast two names
  if (!/^([^0-9]*)$/.test(name) || name.trim().split(' ').length < 2) {
    return 'Name has aleast two 2 names consisting of letters';
  }

  if (dateOfBirth && !Date.parse(dateOfBirth)) {
    return 'Date is not in valid format. Try DD.MM.YYYY';
  }

  // Check if string is Icelandic phone number
  if (phone && !isIcelandicPhoneNumber(phone)) {
    return 'Date is not in valid format. Try DD.MM.YYYY';
  }

  return null;
}

/**
 * Sign up route
 * Sign user up to system. If no errors create user
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object} res
 * @returns {undefined}
 * @author Snær Seljan Þóroddsson
 */
export async function signup(req, res) {
  if (!req.body) {
    return res.status(422).send({ error: 'No post data found' });
  }

  const { email, password, name } = req.body;
  // Validate post request inputs
  const validateError = validateSignup({ email, password, name });

  if (!validateError) {
    try {
      // Check for if user exists by email
      await checkUserByEmail(email);
      const user = new User({ name, email, password });
      // Save user in database
      const data = await saveUser(user);
      // Remove unwanted props for client
      const newUser = removeUserProps(user);
      // Send response object with user token and user information
      return res.status(200).json({
        token: tokenForUser(data),
        ...newUser,
      });
    } catch (error) {
      log.error({ req, res, err: new Error(error) }, 'Error signup user');

      return res.status(422).send({ error });
    }
  } else {
    return res.status(422).send({ error: validateError });
  }
}

/**
 * Signin route
 * If users is authenticated responde with a token
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {undefined}
 * @author Snær Seljan Þóroddsson
 */
export function signin(req, res) {
  const user = req.user;
  let data = null;

  if (user) {
    const userObject = removeUserProps(user);

    data = {
      token: tokenForUser(user),
      ...userObject,
    };

    if (user.roles.includes('admin')) {
      data.role = 'admin';
    }
  }

  return res.status(200).json(data);
}

/**
 * Generates uniq token
 *
 * @returns {Promise} promise - Token
 * @author Snær Seljan Þóroddsson
 */
async function createRandomToken() {
  return Promise(async (resolve, reject) => {
    try {
      // Create buffer
      const buffer = await crypto.randomBytes(20);
      const token = buffer.toString('hex');
      return resolve(token);
    } catch (error) {
      log.error({ err: new Error(error) }, 'Error creating random token');

      return reject(error);
    }
  });
}

/**
 * Send reset password email
 *
 * @returns {Promise} promise - User
 * @author Snær Seljan Þóroddsson
 */
async function sendResetPasswordEmail({ url, email, name }) {
  return Promise(async (resolve, reject) => {
    const mailOptions = {
      to: email,
      subject: 'Password reset',
      text: 'Password reset',
      html: `
          <p>Hi ${name}</p>
          <p>We've received a request to reset your password. If you didn't make the request</p>
          <p>just ignore this email. Otherwise you can reset your password using this link:</p>
          <a href="http://${url}">Click here to reset your password</a>
          <p>Thank you.</p>
      `,
    };

    const { to, subject, text, html } = mailOptions;

    try {
      // Send email
      const info = await sendMail(to, subject, text, html);
      // Return info and email
      return resolve({ info, email });
    } catch (error) {
      log.error(
        { err: new Error(error) },
        'Error sending reset password to email',
      );

      return reject(error);
    }
  });
}

/**
 * Forgot password route
 * TODO describe info
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {undefined}
 * @author Snær Seljan Þóroddsson
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;

  // Create token Save resetPasswordToken and resetPasswordExpires to user Send
  // email to user
  try {
    const token = await createRandomToken();
    const { user } = await attachTokenToUser({ token, email });
    const url = `${HOST}:${PORT}/reset/${token}`;
    const { name } = user;
    const data = await sendResetPasswordEmail({ url, email, name });
    return res
      .status(200)
      .send(
        `An e-mail has been sent to ${data.email} with further instructions.`,
      );
  } catch (error) {
    log.error({ req, res, err: new Error(error) }, 'Error in forgot password');
    return res
      .status(550)
      .send({ error: "Coundn't reset password at this time.", err: error });
  }
}

/**
 * Resets user password
 * Finds user by resetPasswordToken property and resetPasswordExpires
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {undefined}
 * @author Snær Seljan Þóroddsson
 */
export async function resetPassword(req, res) {
  const token = req.params.token;
  const password = req.body.password;

  if (token && password) {
    try {
      const user = await updateUserPassword({ token, password });
      return res.send(
        `Success! Your password has been changed for ${user.email}.`,
      );
    } catch (error) {
      log.error(
        { req, res, err: new Error(error) },
        'Password is invalid or token has expired.',
      );

      return res
        .status(200)
        .send({ error: 'Password is invalid or token has expired.' });
    }
  } else {
    return res.status(200).send({ error: 'Token and password are required' });
  }
}
