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
            })
            .catch(err => {
                console.log(err);
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
            </div>
        );
    }
}

export default Home;