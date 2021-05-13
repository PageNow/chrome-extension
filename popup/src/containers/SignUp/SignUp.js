/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './SignUp.module.css';
import authStyles from '../../shared/Auth.module.css'
import GoogleLogo from '../../g-logo.png';
import { validateEmail, validatePassword } from '../../shared/FormValidator';

class SignUp extends React.Component {
    state = {
        emailInput: '',
        passwordInput: '',
        passwordConfirmInput: '',
        emailInputTouched: false,
        passwordInputTouched: false,
        warning: null, /* Warning message from form validation */
        error: null /* Error message from authentication */
    }

    handleEmailInputChange = (event) => {
        this.setState({
            emailInput: event.target.value,
            emailInputTouched: true
        });
    }

    handlePasswordInputChange = (event) => {
        this.setState({
            passwordInput: event.target.value,
            warning: validatePassword(event.target.value),
            passwordInputTouched: true
        });
    }

    validateEmailInput = () => {
        this.setState({ warning: validateEmail(this.state.emailInput) });
    }

    handleEmailSignUp = () => {
        this.props.setIsLoading(true);
        Auth.signUp(this.state.emailInput, this.state.passwordInput)
            .then(() => {
                this.props.setIsLoading(false);
                this.setState({ warning: null, error: null });
            })
            .catch(err => {
                this.props.setIsLoading(false);
                this.setState({ error: err.message, warning: null });
            })
    }

    render() {
        return (
            <div className={styles.signUpDiv}>
                <div className={styles.signUpHeaderDiv}>
                    <strong>Sign up with email</strong>
                </div>

                <div className={styles.emailDiv}>
                    <div className={styles.emailLabelDiv}>Email</div>
                    <Form.Control size="sm" type="email"
                        placeholder="Enter email"
                        value={this.state.emailInput}
                        onChange={this.handleEmailInputChange}
                        onBlur={this.validateEmailInput}
                    />
                </div>

                <div className={styles.passwordDiv}>
                    <div className={styles.passwordLabelDiv}>Password</div>
                    <Form.Control size="sm" type="password"
                        placeholder="Enter password"
                        value={this.state.passwordInput}
                        onChange={this.handlePasswordInputChange}
                    />
                </div>

                <div className={styles.warningDiv}
                    style={{display: this.state.warning || this.state.error ? 'block' : 'none' }}>
                    <span>
                        {this.state.warning ? this.state.warning : this.state.error}
                    </span>
                </div>

                <Button className={styles.signUpButton}
                    disabled={this.state.error || this.state.warning ||
                              !this.state.emailInputTouched || !this.state.passwordInputTouched}
                    variant='dark' size='sm' block={true} onClick={this.handleEmailSignUp}>
                    <strong>Sign Up</strong>
                </Button>

                <div className={styles.signInDiv}>
                    Already have an account?
                    <span className={styles.signInSpan}
                        onClick={() => {this.props.authModeHandler('sign-in')}}>
                        Sign in
                    </span>
                </div>

                <span className={authStyles.orSpan}>Or</span>

                <div className={authStyles.googleBtn} onClick={this.props.googleSignInHandler}>
                    <div className={authStyles.googleIconWrapper}>
                        <img class={authStyles.googleIcon} src={GoogleLogo} alt="google-logo"/>
                    </div>
                    <p className={authStyles.btnText}><b>Continue with google</b></p>
                </div>

            </div>
        );
    }
}

export default SignUp;