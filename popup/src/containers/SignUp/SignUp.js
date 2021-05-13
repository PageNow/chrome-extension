/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './SignUp.module.css';
import authStyles from '../../shared/Auth.module.css'
import GoogleLogo from '../../g-logo.png';

class SignUp extends React.Component {
    state = {
        emailInput: '',
        passwordInput: '',
        passwordConfirmInput: ''
    }

    handleEmailInputChange = (event) => {
        this.setState({ emailInput: event.target.value });
    }

    handlePasswordInputChange = (event) => {
        this.setState({ passwordInput: event.target.value });
    }

    handleEmailSignUp = () => {
        this.props.setIsLoading(true);
        Auth.signUp(this.state.emailInput, this.state.passwordInput)
            .then(() => {
                this.props.setIsLoading(false);
            })
            .catch(err => {
                this.props.setIsLoading(false);
                console.log(err);
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

                <Button className={styles.signUpButton}
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
                    <p className={authStyles.btnText}><b>Sign in with google</b></p>
                </div>

            </div>
        );
    }
}

export default SignUp;