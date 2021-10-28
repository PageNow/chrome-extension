import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './ConfirmUser.module.css';
import authStyles from '../../shared/Auth.module.css'

const ConfirmUser = (props) => {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSendVerification = () => {
        props.setIsLoading(true);
        Auth.resendSignUp(props.userEmail)
            .then(() => {
                props.setIsLoading(false);
                setMessage("The verification link has been sent to " + props.userEmail);
                setError("");
            })
            .catch(err => {
                props.setIsLoading(false);
                setError(err.message)
                setMessage("");
            })
    }

    return (
        <div className={styles.confirmUserDiv}>
            <div className={authStyles.authTextHeaderDiv}>
                <strong>Verify your account</strong>
            </div>

            <div className={styles.confirmUserSubheaderDiv}>
                <p>
                    Confirm your email by clicking the <strong>verification link sent to your email</strong>.
                </p>
                <p>
                    Re-open the popup window after you confirm your email and sign in again.
                </p>
                <p>
                    If you cannot find the email, check the spam folder or click the button below to resend the link.
                </p>
            </div>

            <div className={styles.confirmUserMessageDiv}
                style={{display: message === '' ? 'none': 'block'}}
            >
                {message}
            </div>

            <div className={styles.confirmUserErrorDiv}
                style={{display: error === '' ? 'none' : 'block'}}
            >
                {error}
            </div>

            <Button className={styles.confirmUserButton} size='sm'
                variant='dark' onClick={handleSendVerification}
            >
                <strong>Resend Verification Link</strong>
            </Button>
        </div>
    )
}; 

export default ConfirmUser;