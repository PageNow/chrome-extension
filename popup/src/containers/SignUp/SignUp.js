/*global chrome*/
import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './SignUp.module.css';
import authStyles from '../../shared/Auth.module.css'
import GoogleLogo from '../../g-logo.png';
import { validateEmail, validatePassword } from '../../shared/FormValidator';
import AuthFooter from '../../components/AuthFooter/AuthFooter';
import PageNowLogo from '../../assets/PageNow_logo_500*118.png';

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
                    warning: chrome.i18n.getMessage("passwordMismatchError")
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
                    <img className={authStyles.authHeaderImg} src={PageNowLogo} alt="PageNow Logo"/>
                </div>

                <div className={styles.emailDiv}>
                    <div className={styles.emailLabelDiv}>{ chrome.i18n.getMessage("email") }</div>
                    <Form.Control size="sm" type="email"
                        placeholder={ chrome.i18n.getMessage("emailInputPlaceholder") }
                        value={this.state.emailInput}
                        onChange={this.handleEmailInputChange}
                        onBlur={this.validateEmailInput}
                    />
                </div>

                <div className={styles.passwordDiv}>
                    <div className={styles.passwordLabelDiv}>{ chrome.i18n.getMessage("password") }</div>
                    <Form.Control size="sm" type="password"
                        placeholder={ chrome.i18n.getMessage("passwordInputPlaceholder") }
                        value={this.state.passwordInput}
                        onChange={this.handlePasswordInputChange}
                    />
                </div>

                <div className={styles.passwordDiv}>
                    <div className={styles.passwordLabelDiv}>{ chrome.i18n.getMessage("confirmPassword") }</div>
                    <Form.Control size="sm" type="password"
                        placeholder={ chrome.i18n.getMessage("confirmPasswordInputPlaceholder") }
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
                    <strong>{ chrome.i18n.getMessage("signUp") }</strong>
                </Button>

                <div className={styles.signInDiv}>
                    { chrome.i18n.getMessage("haveAccountQuestion") }
                    <span className={styles.signInSpan}
                        onClick={() => {this.props.authModeHandler('sign-in')}}>
                        <strong>{ chrome.i18n.getMessage("signIn") }</strong>
                    </span>
                </div>

                <span className={authStyles.orSpan}>{ chrome.i18n.getMessage("or") }</span>

                <div className={authStyles.googleBtn} onClick={this.props.googleSignInHandler}>
                    <div className={authStyles.googleIconWrapper}>
                        <img class={authStyles.googleIcon} src={GoogleLogo} alt="google-logo"/>
                    </div>
                    <p className={authStyles.btnText}><b>{ chrome.i18n.getMessage("continueWithGoogle") }</b></p>
                </div>

                <div className={styles.termsDiv}>
                    { chrome.i18n.getMessage("signUpAgreementBefore") }
                    <a className={styles.termsLink} href="https://www.pagenow.io/privacy-policy"
                       target="_blank" rel="noreferrer">
                        { chrome.i18n.getMessage("privacyPolicy") }
                    </a> { chrome.i18n.getMessage("and") }
                    <a className={styles.termsLink} href="https://www.pagenow.io/terms-of-service"
                       target="_blank" rel="noreferrer">
                        { chrome.i18n.getMessage("termsOfService") }
                    </a>
                    { chrome.i18n.getMessage("signUpAgreementAfter") }.
                </div>

                <AuthFooter />
            </div>
        );
    }
}

export default SignUp;