import React, { Component } from 'react';
import Helmet from 'react-helmet';
// Components
import AuthWrapper from '../../components/auth/authWrapper';
// Styles
import s from './signin.scss';

export default class Signin extends Component {
  render() {
    return (
      <div>
        <Helmet title="Signin" />
        <section className={s.container}>
          <div className={s.center}>
            <div className={s.signinContainer}>
              <div className={s.signinContainerInner}>
                <AuthWrapper />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
