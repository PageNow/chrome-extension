/*global chrome*/
import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';
import axios from 'axios';

import styles from './UserRegistration.module.css';
import { USER_API_URL } from '../../shared/config';

class UserRegistration extends React.Component {
    state = {
        firstNameInput: '',
        lastNameInput: '',
        errorMsg: '',
        ageVerified: false
    }

    handleFirstNameInput = (event) => {
        this.setState({
            firstNameInput: event.target.value
        });
    }

    handleLastNameInput = (event) => {
        this.setState({
            lastNameInput: event.target.value
        });
    }

    handleSignOut = () => {
        Auth.signOut()
            .then(() => {
                // send auth-null to background.js
                chrome.runtime.sendMessage({ type: 'auth-null' });
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-null'
                });
                chrome.storage.local.remove(['google-auth-session', 'auth-jwt']);
                // Remove all chatbox open status
                chrome.storage.local.get(null, items => {
                    const chatboxKeys = Object.keys(items).filter(k => k.startsWith('windowChatboxOpen_'));
                    chrome.storage.local.remove(chatboxKeys);
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    saveUserInformation = () => {
        this.props.setIsLoading(true);
        if (!this.state.ageVerified) {
            this.props.setIsLoading(false);
            return;
        } else {
            Auth.currentSession()
                .then(session => {
                    const httpHeaders = {
                        headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                    };
                    const httpBody = {
                        first_name: this.state.firstNameInput,
                        last_name: this.state.lastNameInput
                    };
                    axios.post(`${USER_API_URL}/users/me`, httpBody, httpHeaders)
                        .then(res => {
                            console.log(res);
                            this.props.setIsLoading(false);
                            this.props.setIsUserRegistered(true);
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({ errorMsg: chrome.i18n.getMessage('internalServerError') });
                            this.props.setIsLoading(false);
                        });
                });
        }        
    }

    checkAgeVerficiation = () => {
        this.setState({
            ageVerified: !this.state.ageVerified
        });
    }

    render() {
        let errorMsgDiv;
        if (this.state.errorMsg !== '') {
            errorMsgDiv = (
                <div className={styles.errorMsgDiv}>* { this.state.errorMsg }</div>
            );
        }

        const userRegistrationDiv = (
            <div className={styles.mainDiv}>
                <div className={styles.headerDiv}>
                    { chrome.i18n.getMessage("submitUserInformation") }
                </div>
                <div className={styles.subheaderDiv}>
                    <strong>{ chrome.i18n.getMessage("name") }</strong>
                </div>
                <div className={styles.nameInputDiv}>
                    <Form.Control size="sm" className={styles.nameInputLeft}
                        placeholder={ chrome.i18n.getMessage("firstName") }
                        value={this.state.firstNameInput}
                        onChange={this.handleFirstNameInput} maxlength='50'
                    />
                    <Form.Control size="sm" className={styles.nameInputRight}
                        placeholder={ chrome.i18n.getMessage("lastName") }
                        value={this.state.lastNameInput}
                        onChange={this.handleLastNameInput} maxlength='50'
                    />
                </div>
                <div className={styles.subheaderDiv}>
                    <strong>{ chrome.i18n.getMessage("confirmAgeHeader") }</strong>
                </div>
                <div className={styles.ageSubheaderDiv}>
                    { chrome.i18n.getMessage("confirmAgeSubheader") }
                </div>
                <div className={styles.ageInputDiv}>
                    <input checked={this.ageVerified} type="checkbox" onClick={this.checkAgeVerficiation}
                        className={styles.ageVerificationInput} />
                    <span>{ chrome.i18n.getMessage("confirmAgeInput") }</span>
                </div>
                <Button variant='dark' size='sm' onClick={this.saveUserInformation} className={styles.saveButton}
                    disabled={this.state.firstNameInput.length === 0 || this.state.lastNameInput.length === 0
                        || !this.state.ageVerified}>
                    { chrome.i18n.getMessage("saveUserInformation") }
                </Button>
                <div className={styles.logOutDiv}>
                    <span className={styles.logOutSpan} onClick={this.handleSignOut}>
                        { chrome.i18n.getMessage("signOut") }
                    </span>
                </div>
                { errorMsgDiv }
            </div>
        );

        return userRegistrationDiv;
    }
}

export default UserRegistration;