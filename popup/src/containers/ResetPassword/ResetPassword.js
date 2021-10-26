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
            warning: this.state.newPasswordInput !== event.target.value ? 'The passwords do not match.' : ''
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
                        &lt; Back
                    </span>
                </div>
                <div className={authStyles.authTextHeaderDiv}>
                    <strong>Reset password</strong>
                </div>

                <div className={styles.codeDiv}>
                    <div className={styles.codeLabelDiv}>Verification Code</div>
                    <Form.Control size="sm" type="text"
                        placeholder="Enter code"
                        value={this.state.codeInput}
                        onChange={this.handleCodeInputChange}
                    />
                </div>

                <div className={styles.newPasswordLabelDiv}>New Password</div>
                <Form.Control size="sm" type="password"
                    placeholder="Enter new password"
                    value={this.state.newPasswordInput}
                    onChange={this.handleNewPasswordInputChange}
                />

                <div className={styles.newPasswordLabelDiv}>Confirm Password</div>
                <Form.Control size="sm" type="password"
                    placeholder="Confirm password"
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
                    <strong>Reset Password</strong>
                </Button>

                <AuthFooter />
            </div>
        );
    }
}
 

export default ResetPassword;