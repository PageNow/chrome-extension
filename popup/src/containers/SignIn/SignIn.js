/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

import styles from './SignIn.module.css';
import authStyles from '../../shared/Auth.module.css';
import GoogleLogo from '../../g-logo.png';
import { validateEmail } from '../../shared/FormValidator';
import AuthFooter from '../../components/AuthFooter/AuthFooter';
import PageNowLogo from '../../assets/PageNow_logo_500*118.png';
import { USER_API_URL } from '../../shared/config';

class SignIn extends React.Component {
    state = {
        emailInput: '',
        passwordInput: '',
        emailInputTouched: false,
        passwordInputTouched: false,
        warning: null, /* Warning message from form validation */
        error: null /* Error message from authentication */
    }

    /* Handle email input field */
    handleEmailInputChange = (event) => {
        this.setState({
            emailInput: event.target.value,
            emailInputTouched: true
        });
    }

    /* Handle password input field */
    handlePasswordInputChange = (event) => {
        this.setState({
            passwordInput: event.target.value,
            // warning: validatePassword(event.target.value),
            passwordInputTouched: true
        });
    }

    validateEmailInput = () => {
        this.setState({ warning: validateEmail(this.state.emailInput) });
    }

    /* Handle sign in via email */
    handleEmailSignIn = () => {
        this.props.setIsLoading(true);
        this.props.setUserInputEmail(this.state.emailInput);
        Auth.signIn(this.state.emailInput, this.state.passwordInput)
            .then(() => {
                return Auth.currentSession();
            })
            .then(session => {
                console.log('sending session to ', this.props.tabId);
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-session',
                    session: session
                });
                chrome.runtime.sendMessage({
                    type: 'auth-jwt',
                    data: session.getIdToken().getJwtToken()
                });
                const httpHeaders = {
                    headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                };
                return axios.get(`${USER_API_URL}/users/me`, httpHeaders);
            })
            .then(() => {
                this.props.setIsUserRegistered(true);
                this.props.setIsLoading(false);
            })
            .catch(err => {
                console.log(err);
                this.props.setIsLoading(false);
                if (err.code === 'UserNotConfirmedException') {
                    this.props.authModeHandler('confirm-user');
                } else {
                    this.setState({ error: err.message, warning: null });
                }
            });
    }

    render() {
        return (
            <div className={styles.signInDiv}>
                <div className={authStyles.authHeaderDiv}>
                    <img className={authStyles.authHeaderImg} src={PageNowLogo} alt="PageNow Logo"/>
                </div>

                <div className={styles.emailLabelDiv}>{ chrome.i18n.getMessage("email") }</div>
                <Form.Control size="sm" type="email"
                    placeholder={ chrome.i18n.getMessage("emailInputPlaceholder") }
                    value={this.state.emailInput}
                    onChange={this.handleEmailInputChange}
                    onBlur={this.validateEmailInput}
                />

                <div className={styles.passwordLabelDiv}>{ chrome.i18n.getMessage("password") }</div>
                <Form.Control size="sm" type="password"
                    placeholder={ chrome.i18n.getMessage("passwordInputPlaceholder") }
                    value={this.state.passwordInput}
                    onChange={this.handlePasswordInputChange}
                />

                <div className={authStyles.warningDiv + ' ' + styles.warningDiv}
                    style={{display: this.state.warning || this.state.error ? 'block' : 'none' }}>
                    <span>
                        {this.state.warning ? this.state.warning : this.state.error}
                    </span>
                </div>

                <div className={styles.forgotPasswordDiv}>
                    <span className={styles.forgotPasswordSpan}
                        onClick={() => {this.props.authModeHandler('forgot-password')}}>
                        { chrome.i18n.getMessage("forgotPassword") }
                    </span>
                </div>

                <Button className={styles.signInButton} variant='dark' size='sm'
                    disabled={this.state.warning ||
                        !this.state.emailInputTouched || !this.state.passwordInputTouched}
                    block={true} onClick={this.handleEmailSignIn}>
                    <strong>{ chrome.i18n.getMessage("signIn") }</strong>
                </Button>
                
                <div className={styles.signUpDiv}>
                    { chrome.i18n.getMessage("needAccountQuestion") }
                    <span className={styles.signUpSpan}
                        onClick={() => {this.props.authModeHandler('sign-up')}}>
                        <strong>{ chrome.i18n.getMessage("signUp") }</strong>
                    </span>
                </div>

                <span className={authStyles.orSpan}>{ chrome.i18n.getMessage("or") }</span>

                <div className={authStyles.googleBtn} onClick={this.props.googleSignInHandler}>
                    <div className={authStyles.googleIconWrapper}>
                        <img class={authStyles.googleIcon} src={GoogleLogo} alt="google-logo"/>
                    </div>
                    <p className={authStyles.btnText}><b>{ chrome.i18n.getMessage("continueWithGoogle") }</b></p>
                </div>
                <AuthFooter />
            </div>
        );
    }
}

export default SignIn;