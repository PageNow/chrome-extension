import React from 'react';
import { Auth } from '@aws-amplify/auth';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import styles from './ResetPassword.module.css';

class ResetPassword extends React.Component {
    state = {
        codeInput: '',
        newPasswordInput: '',
    }

    handleCodeInputChange = (event) => {
        this.setState({ codeInput: event.target.value });
    }

    handleNewPasswordInputChange = (event) => {
        this.setState({ newPasswordInput: event.target.value });
    }

    handleResetPassword = () => {
        this.props.setIsLoading(true);
        Auth.forgotPasswordSubmit(this.props.forgotPasswordEmail,
            this.state.codeInput, this.state.newPasswordInput)
            .then(() => {
                this.props.setIsLoading(false);
                this.props.authModeHandler('sign-in');
            })
            .catch(err => {
                this.props.setIsLoading(false);
                // need error handling
                console.log(err);
            })
    }

    render() {
        return (
            <div className={styles.resetPasswordDiv}>
                {/* <div className={styles.resetPasswordHeaderDiv}>
                    <strong>Reset password</strong>
                </div> */}

                <div className={styles.resetPasswordSubheaderDiv}>
                    Check your email for the code to reset password.
                </div>

                <div className={styles.codeLabelDiv}>Verification Code</div>
                <Form.Control size="sm" type="text"
                    placeholder="Enter code"
                    value={this.state.codeInput}
                    onChange={this.handleCodeInputChange}
                />

                <div className={styles.newPasswordLabelDiv}>New Password</div>
                <Form.Control size="sm" type="password"
                    placeholder="Enter new password"
                    value={this.state.newPasswordInput}
                    onChange={this.handleNewPasswordInputChange}
                />

                <Button className={styles.resetPasswordButton} 
                    variant='dark' size='sm' block={true} onClick={this.handleResetPassword}>
                    <strong>Reset Password</strong>
                </Button>

            </div>
        );
    }
}
 

export default ResetPassword;