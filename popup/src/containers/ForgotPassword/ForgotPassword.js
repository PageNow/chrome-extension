import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './ForgotPassword.module.css';

class ForgotPassword extends React.Component {
    state = {
        error: ''
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
                <div className={styles.forgotPasswordHeaderDiv}>
                    <strong>Forgot password</strong>
                </div>

                <div className={styles.forgotPasswordSubheaderDiv}>
                    Enter your email and we will send you a verification code
                </div>

                <div>
                    <div className={styles.emailLabelDiv}>Email</div>
                    <Form.Control size="sm" type="email"
                        className={styles.emailForm}
                        placeholder="Enter email"
                        value={this.props.forgotPasswordEmail}
                        onChange={this.props.forgotPasswordEmailHandler}
                    />
                </div>

                <div className={styles.forgotPasswordErrorDiv}
                    style={{display: this.state.error === '' ? 'none': 'block'}}
                >
                    { this.state.error }
                </div>

                <Button className={styles.sendCodeButton} 
                    variant='dark' size='sm' block={true} onClick={this.handleSendCode}>
                    <strong>Send Verification Code</strong>
                </Button>
            </div>
        );
    }
}

export default ForgotPassword;