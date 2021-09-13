/*global chrome*/
import React from 'react';
import Button from 'react-bootstrap/Button';
import { Auth } from '@aws-amplify/auth';

import styles from './Home.module.css'

class Home extends React.Component {
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

    render() {
        return (
            <div className={styles.homeDiv}>
                <div className={styles.signOutDiv}>
                    <span className={styles.signOutSpan} onClick={this.handleSignOut}>
                        Sign Out
                    </span>
                </div>
                <div>Logged in as {this.props.email}</div>
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
            </div>
        );
    }
}

export default Home;