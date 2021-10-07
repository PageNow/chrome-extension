/*global chrome*/
import React from 'react';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';
import axios from 'axios';

import styles from './Home.module.css';
import buttonStyles from './ToggleButton.module.css';
import { USER_API_URL } from '../../shared/constants';

class Home extends React.Component {
    state = {
        websocketStatus: -1,
        currUrl: '',
        currDomain: '',
        userInfo: null,
        checked: false,
        showChatIcon: null
    }

    componentDidMount() {
        chrome.runtime.sendMessage({ type: 'curr-domain' }, (response) => {
            this.setState({
                currUrl: response.data.currUrl,
                currDomain: response.data.currDomain
            });
            Auth.currentSession()
                .then(session => {
                    return axios.get(`${USER_API_URL}/users/me`, {
                        headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                    });
                })
                .then(res => {
                    const message = {
                        type: 'update-user-info',
                        data: {
                            userId: res.data.user_id,
                            shareMode: res.data.share_mode,
                            domainAllowSet: res.data.domain_allow_array,
                            domainDenySet: res.data.domain_deny_array
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

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if ('showChatIcon' in changes) {
                this.setState({ showChatIcon: changes.showChatIcon.newValue });
            }
        });
    }

    handleSignOut = () => {
        Auth.signOut()
            .then(() => {
                chrome.tabs.sendMessage(this.props.tabId, {
                    type: 'auth-null'
                });
                chrome.storage.local.remove(['google-auth-session', 'auth-jwt']);
                /* Remove all chatbox open status */
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
        console.log('toggle share');
        let domain_allow_array, domain_deny_array;
        if (this.state.userInfo.share_mode === 'default_none') {
            domain_deny_array = this.state.userInfo.domain_deny_array;
            if (this.state.userInfo.domain_allow_array.includes(this.state.currDomain)) {
                domain_allow_array = this.state.userInfo.domain_allow_array
                    .filter(domain => domain !== this.state.currDomain);
            } else {
                domain_allow_array = [ ...this.state.userInfo.domain_allow_array, this.state.currDomain ];
            }
        } else {
            domain_allow_array = this.state.userInfo.domain_allow_array;
            if (this.state.userInfo.domain_deny_array.includes(this.state.currDomain)) {
                domain_deny_array = this.state.userInfo.domain_deny_array
                    .filter(domain => domain !== this.state.currDomain);
            } else {
                domain_deny_array = [ ...this.state.userInfo.domain_deny_array, this.state.currDomain ];
            }
        }
        const putBody = {
            ...this.state.userInfo,
            domain_allow_array: domain_allow_array,
            domain_deny_array: domain_deny_array
        }
        
        Auth.currentSession()
            .then(session => {
                return axios.put(`${USER_API_URL}/users/me`, putBody, {
                    headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                });
            })
            .then(res => {
                const message = {
                    type: 'update-user-info',
                    data: {
                        userId: res.data.user_id,
                        shareMode: res.data.share_mode,
                        domainAllowSet: res.data.domain_allow_array,
                        domainDenySet: res.data.domain_deny_array
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

    toggleShowChatIcon = () => {
        chrome.storage.local.set({ showChatIcon: !this.state.showChatIcon });
    }

    render() {
        let currDomainDiv, toggleButtonSpan, isSharing;
        const sharingDot = <span className={styles.dot + ' ' + styles.sharingDot}></span>
        const hidingDot = <span className={styles.dot + ' ' + styles.hidingDot}></span>
        if (this.state.userInfo) {
            if (this.state.userInfo.share_mode === 'default_none') {
                if (this.state.userInfo.domain_allow_array.includes(this.state.currDomain)) {
                    isSharing = true;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { sharingDot }<strong>{ this.state.currDomain }</strong>
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Stop sharing activity on domain</span>
                    );
                } else {
                    isSharing = false;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { hidingDot } <strong>{ this.state.currDomain }</strong>
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Start sharing activity on domain</span>
                    );
                    
                }
            } else {
                if (this.state.userInfo.domain_deny_array.includes(this.state.currDomain)) {
                    isSharing = false;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { hidingDot } <strong>{ this.state.currDomain }</strong>
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Start sharing activity on domain</span>
                    );
                } else {
                    isSharing = true;
                    currDomainDiv = (
                        <div className={styles.currDomainDiv}>
                            { sharingDot } <strong>{ this.state.currDomain }</strong>
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Stop sharing activity on domain</span>
                    );
                }
            }
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
                { currDomainDiv }
                <div className={styles.toggleDiv}>
                    <div className={styles.toggleButtonDiv}>
                        <label className={buttonStyles.switch}>
                            <input className={`${buttonStyles.toggleInput} ${isSharing ? buttonStyles.toggleInputSharing : buttonStyles.toggleInputHiding}`}
                                type="checkbox" onClick={this.toggleShare} checked={this.state.checked}/>
                            <span className={`${buttonStyles.slider} ${buttonStyles.round} ${isSharing ? buttonStyles.sliderSharing : buttonStyles.sliderHiding}`}></span>
                        </label>
                    </div>
                    { toggleButtonSpan }
                </div>
                
                <Button className={styles.chatboxToggleButton}
                    variant='dark' size='sm' block={true}
                    onClick={this.props.toggleChatboxHandler}>
                    <strong>
                        {this.props.chatboxToggledOn ? "Close Chatbox" : "Open Chatbox"}
                    </strong>
                </Button>

                <Button variant='dark' size='sm' block={true}
                    onClick={this.toggleShowChatIcon}>
                    <strong>
                        { this.state.showChatIcon ? "Hide Chat Icon" : "Show Chat Icon" }
                    </strong>
                </Button>
            </div>
        );
    }
}

export default Home;