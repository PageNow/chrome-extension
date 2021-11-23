/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import axios from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';

import styles from './Home.module.css';
import buttonStyles from './ToggleButton.module.css';
import { USER_API_URL, PRESENCE_API_URL, EMAIL_API_URL } from '../../shared/config';
import { SHARING_WARNING_MAP } from '../../shared/constants';

class Home extends React.Component {
    state = {
        websocketStatus: -1,
        currUrl: '',
        currDomain: '',
        userInfo: null,
        checked: false,
        showChatIcon: null,
        chatboxOpen: false,
        onlineFriendCnt: null,
        recipientEmail: '',
        emailSentMsg: '',
        emailSentSuccess: false
    }

    componentDidMount() {
        // get the domain of the current page that pop is opened at
        chrome.runtime.sendMessage({ type: 'curr-domain' }, (response) => {
            this.setState({
                currUrl: response.data.currUrl,
                currDomain: response.data.currDomain ? response.data.currDomain : '',
            });
            Auth.currentSession()
                .then(session => {
                    return axios.get(`${USER_API_URL}/users/me`, {
                        headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                    });
                })
                .then(res => {
                    // update domainAllowArray and domainDenyArray frequently for privacy
                    const message = {
                        type: 'update-domain-array',
                        data: {
                            shareMode: res.data.share_mode,
                            domainAllowArray: res.data.domain_allow_array,
                            domainDenyArray: res.data.domain_deny_array
                        }
                    };
                    chrome.runtime.sendMessage(message);
                    this.setState({
                        userInfo: res.data
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        });

        // for toggling 'show chat icon' option
        chrome.storage.local.get(['showChatIcon'], res => {
            if (res.showChatIcon === undefined || res.showChatIcon === null) {
                this.setState({ showChatIcon: true });
            } else {
                this.setState({ showChatIcon: res.showChatIcon });
            }
        });

        // for toggling 'open window chatbox' option
        chrome.windows.getCurrent(window => {
            const windowChatboxOpenKey = 'windowChatboxOpen_' + window.id;
            chrome.storage.local.get(windowChatboxOpenKey, item => {
                this.setState({
                    chatboxOpen: item[windowChatboxOpenKey]
                });
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (Object.keys(changes).includes('showChatIcon')) {
                    this.setState({ showChatIcon: changes.showChatIcon.newValue });
                } else if (Object.keys(changes).includes(windowChatboxOpenKey)) {
                    this.setState({
                        chatboxOpen: changes[windowChatboxOpenKey].newValue
                    });
                }
            });
        });

        // since current domain update is asynchronous, listen to any updates
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'update-domain':
                    this.setState({
                        currUrl: request.url,
                        currDomain: request.domain ? request.domain : ''
                    });
                    break;
                default:
                    break;
            }
        });

        // get the number of friends online to display on popup
        this.getOnlineFriendsCnt();
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
                // Set showChatIcon to false instead of removing the key
                chrome.storage.local.set({
                    showChatIcon: false
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    toggleShare = () => {
        let domain_array, share_type;
        if (this.state.userInfo.share_mode === 'default_none') {
            if (this.state.userInfo.domain_allow_array.includes(this.state.currDomain)) {
                domain_array = this.state.userInfo.domain_allow_array
                    .filter(domain => domain !== this.state.currDomain);
            } else {
                domain_array = [ ...this.state.userInfo.domain_allow_array, this.state.currDomain ];
            }
            share_type = 'allow';
        } else {
            if (this.state.userInfo.domain_deny_array.includes(this.state.currDomain)) {
                domain_array = this.state.userInfo.domain_deny_array
                    .filter(domain => domain !== this.state.currDomain);
            } else {
                domain_array = [ ...this.state.userInfo.domain_deny_array, this.state.currDomain ];
            }
            share_type = 'deny';
        }

        Auth.currentSession()
            .then(session => {
                return axios.put(`${USER_API_URL}/users/me/domain_array/${share_type}`, domain_array, {
                    headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                });
            })
            .then(res => {
                const message = {
                    type: 'update-domain-array',
                    data: {
                        shareMode: res.data.share_mode,
                        domainAllowArray: res.data.domain_allow_array,
                        domainDenyArray: res.data.domain_deny_array
                    }
                };
                chrome.runtime.sendMessage(message);
                this.setState({
                    userInfo: res.data,
                    checked: false
                });
            })
            .catch(err => {
                console.log(err);
            })
    }

    /* Toggle chatbox for window */
    toggleChatbox = () => {
        chrome.windows.getCurrent(window => {
            const windowChatboxOpenKey = 'windowChatboxOpen_' + window.id;
            const updatedItem = {};
            if (this.state.chatboxOpen) {
                updatedItem[windowChatboxOpenKey] = false;
                chrome.storage.local.set(updatedItem);
            } else {
                updatedItem[windowChatboxOpenKey] = true;
                updatedItem['showChatIcon'] = true;
                chrome.storage.local.set(updatedItem);
            }
        });
    }

    toggleShowChatIcon = () => {
        chrome.storage.local.set({ showChatIcon: !this.state.showChatIcon });
    }

    getOnlineFriendsCnt = () => {
        Auth.currentSession()
            .then(session => {
                return axios.get(`${PRESENCE_API_URL}/presence`, {
                    headers: { Authorization: session.getIdToken().getJwtToken() }
                });
            })
            .then(res => {
                this.setState({
                    onlineFriendCnt: res.data.presenceArr.filter(x => x.page !== null).length
                });
            });
    }

    handleRecipientEmailChange = (event) => {
        this.setState({
            recipientEmail: event.target.value
        });
    }

    sendInviteEmail = () => {
        Auth.currentSession()
            .then(session => {
                const body = {
                    senderFirstName: this.state.userInfo.first_name,
                    senderLastName: this.state.userInfo.last_name,
                    recipientEmail: this.state.recipientEmail
                };
                const options = {
                    headers: { Authorization: session.getIdToken().getJwtToken() }
                };
                return axios.post(`${EMAIL_API_URL}/email`, body, options);
            })
            .then(res => {
                this.setState({
                    recipientEmail: '',
                    emailSentMsg: 'Invitation is sent!',
                    emailSentSuccess: true
                });
            })
            .catch(err => {
                this.setState({
                    emailSentMsg: 'Sorry, something went wrong...',
                    emailSentSuccess: false
                });
            });
    }

    render() {
        let currDomainDiv, shareToggleButtonSpan, shareToggleButtonDiv, chatIconToggleDiv, spinnerDiv;
        let isSharing, sharingDot, hidingDot; // display whether the domain is shared or not
        let onlineFriendCntDiv, warningSpan, refreshDiv;
        spinnerDiv = (
            <div className={styles.spinnerDiv}>
                <Spinner className={styles.spinner} animation="grow" variant="primary" size="sm" />
            </div>
        );
        if (SHARING_WARNING_MAP.hasOwnProperty(this.state.currDomain)) {
            warningSpan = (
                <span className={styles.warningSpan}>
                    { SHARING_WARNING_MAP[this.state.currDomain] }
                </span>
            );
        }
        if (this.state.userInfo) {
            sharingDot = <span className={styles.dot + ' ' + styles.sharingDot}></span>;
            hidingDot = <span className={styles.dot + ' ' + styles.hidingDot}></span>;
            if (this.state.userInfo.share_mode === 'default_none') {
                if (this.state.userInfo.domain_allow_array.includes(this.state.currDomain)) {
                    isSharing = true;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { sharingDot }
                            <strong>{ this.state.currDomain === '' ? '(Empty Domain)' : this.state.currDomain }
                        </strong>
                        </div>
                    );
                    shareToggleButtonSpan = (
                        <span className={styles.shareToggleButtonSpan}>
                            { chrome.i18n.getMessage("toggleStopSharing") }
                        </span>
                    );
                } else {
                    isSharing = false;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { hidingDot }
                            <strong>{ this.state.currDomain === '' ? '(Empty Domain)' : this.state.currDomain }</strong>
                        </div>
                    );
                    shareToggleButtonSpan = (
                        <span className={styles.shareToggleButtonSpan}>
                            { chrome.i18n.getMessage("toggleStartSharing") }
                        </span>
                    );
                }
            } else {
                if (this.state.userInfo.domain_deny_array.includes(this.state.currDomain)) {
                    isSharing = false;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { hidingDot }
                            <strong>{ this.state.currDomain === '' ? '(Empty Domain)' : this.state.currDomain }</strong>
                        </div>
                    );
                    shareToggleButtonSpan = (
                        <span className={styles.shareToggleButtonSpan}>
                            { chrome.i18n.getMessage("toggleStartSharing") }
                        </span>
                    );
                } else {
                    isSharing = true;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { sharingDot }
                            <strong>{ this.state.currDomain === '' ? '(Empty Domain)' : this.state.currDomain }</strong>
                        </div>
                    );
                    shareToggleButtonSpan = (
                        <span className={styles.shareToggleButtonSpan}>
                            { chrome.i18n.getMessage("toggleStopSharing") }
                        </span>
                    );
                }
            }
            shareToggleButtonDiv = (
                <div className={styles.shareToggleButtonDiv}>
                    <label className={buttonStyles.switch}>
                        <input className={`${buttonStyles.toggleInput} ${isSharing ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputHiding}`}
                            type="checkbox" onClick={this.toggleShare} checked={this.state.checked}/>
                        <span className={`${buttonStyles.slider} ${buttonStyles.round} ${isSharing ? buttonStyles.sliderSharing : buttonStyles.sliderHiding}`}></span>
                    </label>
                </div>
            );
            spinnerDiv = null;
        }

        let chatIconPositionSpan;
        if (this.state.showChatIcon) {
            chatIconPositionSpan = (
                <span className={styles.chatIconPositionSpan}>
                    ({ chrome.i18n.getMessage("chatIconLocation") })
                </span>
            );
        }

        if (!this.props.chatboxToggledOn) {
            chatIconToggleDiv = (
                <div className={styles.chatIconToggleDiv}>
                    <div className={styles.chatboxToggleButtonDiv}>
                        <label className={buttonStyles.switch}>
                            <input className={`${buttonStyles.toggleInput} ${this.state.showChatIcon ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputClosed}`}
                                type="checkbox" onClick={this.toggleShowChatIcon} checked={this.state.showChatIcon} />
                            <span className={`${buttonStyles.slider} ${buttonStyles.round} ${this.state.showChatIcon ? buttonStyles.sliderOpen : buttonStyles.sliderHiding}`}></span>
                        </label>
                    </div>
                    <span className={styles.chatIconToggleSpan}>
                        { this.state.showChatIcon ? chrome.i18n.getMessage("toggleChatIconOff") : chrome.i18n.getMessage("toggleChatIconOn") }
                    </span>
                    { chatIconPositionSpan }
                </div>
            )
        }

        // display the number of online friends only if any
        if (this.state.onlineFriendCnt !== null && this.state.onlineFriendCnt > 0) {
            onlineFriendCntDiv = (
                <div className={styles.onlineFriendsCnt}>
                    <i>{chrome.i18n.getMessage("onlineFriendsCount")}: <strong>{ this.state.onlineFriendCnt }</strong></i>
                </div>
            )
        }
        
        return (
            <div className={styles.homeDiv}>
                <div className={styles.headerDiv}>
                    <span>
                        {this.props.email}
                    </span>
                    <span className={styles.signOutSpan} onClick={this.handleSignOut}>
                        { chrome.i18n.getMessage("signOut") }
                    </span>
                </div>
                { spinnerDiv }
                { onlineFriendCntDiv }
                { currDomainDiv }
                <div className={styles.shareToggleDiv}>
                    { shareToggleButtonDiv }
                    { shareToggleButtonSpan }
                </div>
                { warningSpan }

                <div class={styles.chatboxToggleDiv}>
                    <div className={styles.chatboxToggleButtonDiv}>
                        <label className={buttonStyles.switch}>
                            <input className={`${buttonStyles.toggleInput} ${this.state.chatboxOpen ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputClosed}`}
                                type="checkbox" onClick={this.toggleChatbox} checked={this.state.chatboxOpen} />
                            <span className={`${buttonStyles.slider} ${buttonStyles.round} ${this.state.chatboxOpen ? buttonStyles.sliderOpen : buttonStyles.sliderHiding}`}></span>
                        </label>
                    </div>
                    <span className={styles.chatboxToggleSpan}>
                        { this.props.chatboxToggledOn ? chrome.i18n.getMessage("toggleChatboxOff") : chrome.i18n.getMessage("toggleChatboxOn") }
                    </span>
                </div>

                { chatIconToggleDiv }

                <div className={styles.refreshDiv}>
                    * { chrome.i18n.getMessage("refreshMessage") }
                </div>

                <div className={styles.inviteHeader}>
                    { chrome.i18n.getMessage("invitationHeader") }
                </div>
                <InputGroup size="sm">
                    <FormControl size="sm" placeholder={ chrome.i18n.getMessage("inviteInputPlaceholder") }
                        value={this.state.recipientEmail}
                        onChange={this.handleRecipientEmailChange}    
                    />
                    <Button variant="outline-secondary" onClick={this.sendInviteEmail}>
                        { chrome.i18n.getMessage("inviteButtonContent") }
                    </Button>
                </InputGroup>
                <div className={this.state.emailSentSuccess ? styles.emailSentSuccessDiv : styles.emailSentFailureDiv}>
                    { this.state.emailSentMsg }
                </div>
            </div>
        );
    }
}

export default Home;