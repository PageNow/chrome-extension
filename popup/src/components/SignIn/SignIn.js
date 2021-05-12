/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './SignIn.module.css';

class SignIn extends React.Component {
    state = {
        emailInput: '',
        passwordInput: ''
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
        console.log('handleSignIn');
        Auth.signIn(this.state.emailInput, this.state.passwordInput)
            .then(() => {
                console.log('handleSignIn then')
                return Auth.currentSession();
            })
            .then(session => {
                console.log('auth current session then');
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-session',
                    session: session
                });
            })
            .catch(err => {
                /* Error Handling */
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
                
            </div>
        );
    }
}

export default SignIn;