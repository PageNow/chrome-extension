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
        userInfo: null
    }

    componentDidMount() {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                switch (request.type) {
                    case 'update-presence':
                        console.log(request.data);
                        break;
                    default:
                        console.log('request type not found');
                        break;
                }
            }
        )

        chrome.runtime.sendMessage({ type: 'curr-domain' }, (response) => {
            this.setState({
                currUrl: response.data.currUrl,
                currDomain: response.data.currDomain
            });
        })

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
                // chrome.runtime.sendMessage(EXTENSION_ID, message);
                chrome.runtime.sendMessage(message);
                this.setState({ userInfo: res.data });
            })
            .catch(err => {
                console.log(err);
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

    connectWebsocket = () => {
        chrome.runtime.sendMessage({
            type: 'connect-websocket'
        });
    }

    disconnectWebsocket = () => {
        chrome.runtime.sendMessage({
            type: 'disconnect-websocket'
        });
    }

    getWebsocketStatus = () => {
        chrome.runtime.sendMessage({
            type: 'websocket-status'
        }, response => {
            console.log(response);
            this.setState({ websocketStatus: response.status });
        });
    }

    addToDomainAllowArray = () => {

    }

    addToDomainDenyArray = () => {

    }

    render() {
        let currDomainDiv, toggleButtonSpan;
        console.log(this.state.userInfo);
        if (this.state.userInfo) {
            if (this.state.userInfo.share_mode === 'default_none') {
                if (this.state.userInfo.domain_allow_array.includes(this.state.currDomain)) {
                    currDomainDiv = (
                        <div>
                            <strong>{ this.state.currDomain }</strong> - activity shared
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Stop sharing <strong>{ this.state.currDomain}</strong></span>
                    );
                } else {
                    currDomainDiv = (
                        <div>
                            <strong>{ this.state.currDomain }</strong> - activity hidden
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Start sharing <strong>{ this.state.currDomain}</strong></span>
                    );
                }
            } else {
                if (this.state.userInfo.domain_deny_array.includes(this.state.currDomain)) {
                    currDomainDiv = (
                        <div>
                            <strong>{ this.state.currDomain }</strong> - activity hidden
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Start sharing <strong>{ this.state.currDomain}</strong></span>
                    );
                } else {
                    currDomainDiv = (
                        <div>
                            <strong>{ this.state.currDomain }</strong> - activity shared
                        </div>
                    );
                    toggleButtonSpan = (
                        <span>Stop sharing <strong>{ this.state.currDomain}</strong></span>
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
                <div>
                    <label className={buttonStyles.switch}>
                        <input className={buttonStyles.toggleInput} type="checkbox" />
                        <span className={buttonStyles.slider + ' ' + buttonStyles.round}></span>
                    </label>
                    { toggleButtonSpan }
                </div>
                
                <Button className={styles.toggleButton}
                    variant='dark' size='sm' block={true}
                    onClick={this.props.toggleChatboxHandler}>
                    <strong>
                        {this.props.chatboxToggledOn ? "Close Chatbox" : "Open Chatbox"}
                    </strong>
                </Button>
                <Button onClick={this.connectWebsocket}>
                    Connect websocket
                </Button>
                <Button onClick={this.disconnectWebsocket}>
                    Disconnect websocket
                </Button>
                <Button onClick={this.getWebsocketStatus}>
                    Get websocket status
                </Button>
                <div>
                    Websocket Status: {this.state.websocketStatus}
                </div>
            </div>
        );
    }
}

export default Home;