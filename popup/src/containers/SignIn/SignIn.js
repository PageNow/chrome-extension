/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './SignIn.module.css';
import authStyles from '../../shared/Auth.module.css';
import GoogleLogo from '../../g-logo.png';
import { validateEmail } from '../../shared/FormValidator';
import AuthFooter from '../../components/AuthFooter/AuthFooter';

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
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-session',
                    session: session
                });
                chrome.runtime.sendMessage({
                    type: 'auth-jwt',
                    data: session.getIdToken().getJwtToken()
                });
                this.props.setIsLoading(false);
            })
            .catch(err => {
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
                    <strong>PageNow SignIn</strong>
                </div>

                <div className={styles.emailLabelDiv}>Email</div>
                <Form.Control size="sm" type="email"
                    placeholder="Enter email"
                    value={this.state.emailInput}
                    onChange={this.handleEmailInputChange}
                    onBlur={this.validateEmailInput}
                />

                <div className={styles.passwordLabelDiv}>Password</div>
                <Form.Control size="sm" type="password"
                    placeholder="Enter password"
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
                        Forgot password?
                    </span>
                </div>

                <Button className={styles.signInButton} variant='dark' size='sm'
                    disabled={this.state.warning ||
                        !this.state.emailInputTouched || !this.state.passwordInputTouched}
                    block={true} onClick={this.handleEmailSignIn}>
                    <strong>Sign In</strong>
                </Button>
                
                <div className={styles.signUpDiv}>
                    Need an account?
                    <span className={styles.signUpSpan}
                        onClick={() => {this.props.authModeHandler('sign-up')}}>
                        Sign up
                    </span>
                </div>

                <span className={authStyles.orSpan}>Or</span>

                <div className={authStyles.googleBtn} onClick={this.props.googleSignInHandler}>
                    <div className={authStyles.googleIconWrapper}>
                        <img class={authStyles.googleIcon} src={GoogleLogo} alt="google-logo"/>
                    </div>
                    <p className={authStyles.btnText}><b>Continue with google</b></p>
                </div>
                <AuthFooter />
            </div>
        );
    }
}

export default SignIn;