/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './ResetPassword.module.css';
import authStyles from '../../shared/Auth.module.css';
import { validatePassword } from '../../shared/FormValidator';
import AuthFooter from '../../components/AuthFooter/AuthFooter';

class ResetPassword extends React.Component {
    state = {
        codeInput: '',
        newPasswordInput: '',
        passwordConfirmInput: '',
        error: null,
        warning: null
    }

    handleCodeInputChange = (event) => {
        this.setState({ codeInput: event.target.value });
    }

    handleNewPasswordInputChange = (event) => {
        this.setState({
            newPasswordInput: event.target.value,
            warning: validatePassword(event.target.value)
        });
    }

    handlePasswordConfirmInputChange = (event) => {
        this.setState({
            passwordConfirmInput: event.target.value,
            warning: this.state.newPasswordInput !== event.target.value ?
                chrome.i18n.getMessage("passwordMismatchError") : ''
        })
    }

    handleClickBack = () => {
        this.props.authModeHandler('forgot-password');
    }

    handleResetPassword = () => {
        this.props.setIsLoading(true);
        Auth.forgotPasswordSubmit(this.props.forgotPasswordEmail,
            this.state.codeInput, this.state.newPasswordInput)
            .then(() => {
                this.setState({ warning: null, error: null });
                this.props.setIsLoading(false);
                this.props.authModeHandler('sign-in');
            })
            .catch(err => {
                console.log(err);
                this.props.setIsLoading(false);
                this.setState({ error: err.message, warning: null });
            });
    }

    render() {
        return (
            <div className={styles.resetPasswordDiv}>
                <div className={authStyles.backDiv}>
                    <span className={authStyles.backSpan} onClick={this.handleClickBack}>
                        &lt; { chrome.i18n.getMessage("back") }
                    </span>
                </div>
                <div className={authStyles.authTextHeaderDiv}>
                    <strong>{ chrome.i18n.getMessage("resetPassword") }</strong>
                </div>

                <div className={styles.codeDiv}>
                    <div className={styles.codeLabelDiv}>{ chrome.i18n.getMessage("verificationCode") }</div>
                    <Form.Control size="sm" type="text"
                        placeholder={ chrome.i18n.getMessage("verificationCodeInputPlaceholder") }
                        value={this.state.codeInput}
                        onChange={this.handleCodeInputChange}
                    />
                </div>

                <div className={styles.newPasswordLabelDiv}>{ chrome.i18n.getMessage("newPassword") }</div>
                <Form.Control size="sm" type="password"
                    placeholder={ chrome.i18n.getMessage("newPasswordInputPlaceholder") }
                    value={this.state.newPasswordInput}
                    onChange={this.handleNewPasswordInputChange}
                />

                <div className={styles.newPasswordLabelDiv}>{ chrome.i18n.getMessage("confirmPassword") }</div>
                <Form.Control size="sm" type="password"
                    placeholder={ chrome.i18n.getMessage("confirmPasswordInputPlaceholder") }
                    value={this.state.passwordConfirmInput}
                    onChange={this.handlePasswordConfirmInputChange}
                />

                <div className={styles.resetPasswordErrorDiv}
                    style={{display: this.state.warning || this.state.error ? 'block' : 'none'}}
                >
                    { this.state.warning ? this.state.warning : this.state.error }
                </div>

                <Button className={styles.resetPasswordButton}
                    disabled={this.state.warning}
                    variant='dark' size='sm' block={true} onClick={this.handleResetPassword}>
                    <strong>{ chrome.i18n.getMessage("resetPassword") }</strong>
                </Button>

                <AuthFooter />
            </div>
        );
    }
}
 

export default ResetPassword;