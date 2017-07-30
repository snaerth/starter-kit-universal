/**
 * Validates if string is Icelandic phone number
 *
 * @param {String} phone
 * @returns {bool}
 */
export function isIcelandicPhoneNumber(phone) {
  return /^(?:\+|[0]{2})?(354)?(:?[\s-])*\d{3}(:?[\s-])*\d{4}$/.test(phone);
}

/**
 * Validates email string
 * @param {String} email - Email string
 * @returns true if valid, false otherwise
 */
export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}