/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './SignIn.module.css';
import authStyles from '../../shared/Auth.module.css';
import GoogleLogo from '../../g-logo.png';

class SignIn extends React.Component {
    state = {
        emailInput: '',
        passwordInput: '',
    }

    /* Handle email input field */
    handleEmailInputChange = (event) => {
        this.setState({ emailInput: event.target.value });
    }

    /* Handle password input field */
    handlePasswordInputChange = (event) => {
        this.setState({ passwordInput: event.target.value });
    }

    /* Handle sign in via email */
    handleEmailSignIn = () => {
        this.props.setIsLoading(true);
        Auth.signIn(this.state.emailInput, this.state.passwordInput)
            .then(() => {
                return Auth.currentSession();
            })
            .then(session => {
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-session',
                    session: session
                });
                this.props.setIsLoading(false);
            })
            .catch(err => {
                this.props.setIsLoading(false);
                console.log(err);
            });
    }

    render() {
        return (
            <div className={styles.signInDiv}>
                <div className={styles.signInHeaderDiv}>
                    <strong>Sign in with email</strong>
                </div>

                <div className={styles.emailDiv}>
                    <div className={styles.emailLabelDiv}>Email</div>
                    <Form.Control size="sm" type="email"
                        className={styles.emailForm}
                        placeholder="Enter email"
                        value={this.state.emailInput}
                        onChange={this.handleEmailInputChange}
                    />
                </div>

                <div className={styles.passwordDiv}>
                    <div className={styles.passwordLabelDiv}>Password</div>
                    <Form.Control size="sm" type="password"
                        className={styles.passwordForm}
                        placeholder="Enter password"
                        value={this.state.passwordInput}
                        onChange={this.handlePasswordInputChange}
                    />
                </div>

                <div className={styles.forgotPasswordDiv}>
                    <span className={styles.forgotPasswordSpan}
                        onClick={() => {this.props.authModeHandler('forgot-password')}}>
                        Forgot password?
                    </span>
                </div>

                <Button className={styles.signInButton} 
                    variant='dark' size='sm' block={true} onClick={this.handleEmailSignIn}>
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
                    <p className={authStyles.btnText}><b>Sign in with google</b></p>
                </div>

            </div>
        );
    }
}

export default SignIn;