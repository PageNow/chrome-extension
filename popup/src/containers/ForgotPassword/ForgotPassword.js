/*global chrome*/
import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './ForgotPassword.module.css';
import authStyles from '../../shared/Auth.module.css';
import AuthFooter from '../../components/AuthFooter/AuthFooter';
import { validateEmail } from '../../shared/FormValidator';

class ForgotPassword extends React.Component {
    state = {
        error: ''
    }

    handleClickBack = () => {
        this.props.authModeHandler('sign-in')
    }

    validateEmailInput = () => {
        this.setState({ error: validateEmail(this.props.forgotPasswordEmail) });
    }

    handleEmailInputChange = (event) => {
        this.props.forgotPasswordEmailHandler(event);
        this.validateEmailInput();
    }

    handleSendCode = () => {
        this.props.setIsLoading(true);
        Auth.forgotPassword(this.props.forgotPasswordEmail)
            .then(() => {
                this.props.setIsLoading(false);
                this.props.authModeHandler('reset-password');
                this.setState({ error: '' });
            })
            .catch(err => {
                // TODO - error handling (warning message)
                this.props.setIsLoading(false);
                if (err.code === 'InvalidParameterException') {
                    this.setState({
                        error: 'Please verify your email before resetting the password'
                    });
                } else if (err.code === 'UserNotFoundException') {
                    this.setState({ 
                        error: 'Your email is not registered.'
                    });
                } else {
                    console.log(err);
                    this.setState({ error: err.message });
                }
            });
    }

    render() {
        return (
            <div className={styles.forgotPasswordDiv}>
                <div className={authStyles.backDiv}>
                    <span className={authStyles.backSpan} onClick={this.handleClickBack}>
                        &lt; { chrome.i18n.getMessage("back") }
                    </span>
                </div>
                <div className={authStyles.authTextHeaderDiv}>
                    <strong>{ chrome.i18n.getMessage("forgotPasswordHeader") }</strong>
                </div>

                <div className={styles.forgotPasswordSubheaderDiv}>
                    { chrome.i18n.getMessage("forgotPasswordInstruction") }
                </div>

                <div>
                    <div className={styles.emailLabelDiv}>{ chrome.i18n.getMessage("email") }</div>
                    <Form.Control size="sm" type="email"
                        className={styles.emailForm}
                        placeholder={ chrome.i18n.getMessage("emailInputPlaceholder") }
                        value={this.props.forgotPasswordEmail}
                        onChange={this.handleEmailInputChange}
                    />
                </div>

                <div className={styles.forgotPasswordErrorDiv}
                    style={{display: this.state.error === '' ? 'none': 'block'}}
                >
                    { this.state.error }
                </div>

                <Button className={styles.sendCodeButton} 
                    variant='dark' size='sm' block={true} onClick={this.handleSendCode}
                    disabled={(this.state.error !== null && this.state.error !== '') ||
                              this.props.forgotPasswordEmail === ''}
                >
                    <strong>{ chrome.i18n.getMessage("sendVerificationCode") }</strong>
                </Button>

                <Button className={styles.sendCodeButton} 
                    variant='dark' size='sm' block={true} onClick={() => this.props.authModeHandler('reset-password')}
                    disabled={(this.state.error !== null && this.state.error !== '') ||
                              this.props.forgotPasswordEmail === ''}
                >
                    <strong>{ chrome.i18n.getMessage("alreadyHaveVerificationCode") }</strong>
                </Button>

                <AuthFooter />
            </div>
        );
    }
}

export default ForgotPassword;