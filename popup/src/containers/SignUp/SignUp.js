import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './SignUp.module.css';
import authStyles from '../../shared/Auth.module.css'
import GoogleLogo from '../../g-logo.png';
import { validateEmail, validatePassword } from '../../shared/FormValidator';
// import AuthFooter from '../../components/AuthFooter/AuthFooter';

class SignUp extends React.Component {
    state = {
        emailInput: '',
        passwordInput: '',
        passwordConfirmInput: '',
        emailInputTouched: false,
        passwordInputTouched: false,
        passwordConfirmInputTouched: false,
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

    handlePasswordConfirmInputChange = (event) => {
        this.setState({
            passwordConfirmInput: event.target.value,
            passwordConfirmInputTouched: true
        }, () => {
            if (this.state.passwordConfirmInputTouched && 
                this.state.passwordInput !== this.state.passwordConfirmInput) {
                this.setState({
                    warning: "The passwords do not match."
                });
            } else {
                this.setState({
                    warning: ''
                });
            }
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
                this.props.authModeHandler('confirm-user');
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
                <div className={authStyles.authHeaderDiv}>
                    <strong>PageNow SignUp</strong>
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

                <div className={styles.passwordDiv}>
                    <div className={styles.passwordLabelDiv}>Confirm Password</div>
                    <Form.Control size="sm" type="password"
                        placeholder="Confirm password"
                        value={this.state.passwordConfirmInput}
                        onChange={this.handlePasswordConfirmInputChange}
                    />
                </div>

                <div className={authStyles.warningDiv}
                    style={{display: this.state.warning || this.state.error ? 'block' : 'none' }}>
                    <span>
                        {this.state.warning ? this.state.warning : this.state.error}
                    </span>
                </div>

                <Button className={styles.signUpButton} variant='dark' size='sm'
                    disabled={this.state.warning ||
                              !this.state.emailInputTouched || !this.state.passwordInputTouched ||
                              this.state.passwordInput !== this.state.passwordConfirmInput}
                    block={true} onClick={this.handleEmailSignUp}>
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

                {/* <AuthFooter /> */}
            </div>
        );
    }
}

export default SignUp;