/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import axios from 'axios';
import Spinner from 'react-bootstrap/Spinner';

import styles from './Home.module.css';
import buttonStyles from './ToggleButton.module.css';
import { USER_API_URL } from '../../shared/config';

class Home extends React.Component {
    state = {
        websocketStatus: -1,
        currUrl: '',
        currDomain: '',
        userInfo: null,
        checked: false,
        showChatIcon: null,
        chatboxOpen: false,
    }

    componentDidMount() {
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

        chrome.storage.local.get(['showChatIcon'], res => {
            if (res.showChatIcon === undefined || res.showChatIcon === null) {
                this.setState({ showChatIcon: true });
            } else {
                this.setState({ showChatIcon: res.showChatIcon });
            }
        });

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
    }

    handleSignOut = () => {
        Auth.signOut()
            .then(() => {
                // send auth-null to background.js
                chrome.runtime.sendMessage({ type: 'auth-null' });
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-null'
                });
                chrome.storage.local.remove(['google-auth-session', 'auth-jwt', 'showChatIcon']);
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
                chrome.storage.local.set(updatedItem);
            }
        });
    }

    toggleShowChatIcon = () => {
        chrome.storage.local.set({ showChatIcon: !this.state.showChatIcon });
    }

    render() {
        let currDomainDiv, shareToggleButtonSpan, shareToggleButtonDiv, spinnerDiv;
        let isSharing, sharingDot, hidingDot;
        spinnerDiv = (
            <div className={styles.spinnerDiv}>
                <Spinner className={styles.spinner} animation="grow" variant="primary" size="sm" />
            </div>
        );
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
                            Stop sharing activity on domain
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
                            Start sharing activity on domain
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
                            Start sharing activity on domain
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
                            Stop sharing activity on domain
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
        
        return (
            <div className={styles.homeDiv}>
                <div className={styles.headerDiv}>
                    <span>
                        {this.props.email}
                    </span>
                    <span className={styles.signOutSpan} onClick={this.handleSignOut}>
                        Sign Out
                    </span>
                </div>
                { spinnerDiv }
                { currDomainDiv }
                <div className={styles.shareToggleDiv}>
                    { shareToggleButtonDiv }
                    { shareToggleButtonSpan }
                </div>

                <div class={styles.chatboxToggleDiv}>
                    <div className={styles.chatboxToggleButtonDiv}>
                        <label className={buttonStyles.switch}>
                            <input className={`${buttonStyles.toggleInput} ${this.state.chatboxOpen ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputClosed}`}
                                type="checkbox" onClick={this.toggleChatbox} checked={this.state.chatboxOpen} />
                            <span className={`${buttonStyles.slider} ${buttonStyles.round} ${this.state.chatboxOpen ? buttonStyles.sliderOpen : buttonStyles.sliderHiding}`}></span>
                        </label>
                    </div>
                    <span className={styles.chatboxToggleSpan}>
                        { this.props.chatboxToggledOn ? "Close Chatbox" : "Open Chatbox" }
                    </span>
                </div>

                <div className={styles.chatIconToggleDiv}>
                    <div className={styles.chatboxToggleButtonDiv}>
                        <label className={buttonStyles.switch}>
                            <input className={`${buttonStyles.toggleInput} ${this.state.showChatIcon ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputClosed}`}
                                type="checkbox" onClick={this.toggleShowChatIcon} checked={this.state.showChatIcon} />
                            <span className={`${buttonStyles.slider} ${buttonStyles.round} ${this.state.showChatIcon ? buttonStyles.sliderOpen : buttonStyles.sliderHiding}`}></span>
                        </label>
                    </div>
                    <span className={styles.chatIconToggleSpan}>
                        { this.state.showChatIcon ? "Hide Chat Icon" : "Show Chat Icon" }
                    </span>
                </div>

                <div class='warning-div'>
                    * Please refresh the page if there is something wrong with the chatbox.
                </div>
            </div>
        );
    }
}

export default Home;