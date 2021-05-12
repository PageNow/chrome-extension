/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import { Hub } from 'aws-amplify';

import SignIn from './components/SignIn/SignIn';
import SignUp from './components/SignUp/SignUp';
import './App.css';

class App extends React.Component {
    /* state refreshes every time you open the popup */
    state = {
        chatboxToggledOn: false,
        authState: null,
        tabInfo: null,
        authMode: 'sign-in' /* sign-up, sign-in, forgot-password */
    }

    componentDidMount() {
        /* Use Chrome storage to manage chatbox open state for each window */
        chrome.windows.getCurrent(window => {
            const windowChatboxOpenKey = 'windowChatboxOpen_' + window.id;
            chrome.storage.local.get(windowChatboxOpenKey, item => {
                this.setState({
                    chatboxToggledOn: item[windowChatboxOpenKey]
                });
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (windowChatboxOpenKey in changes) {
                    this.setState({
                        chatboxToggledOn: changes[windowChatboxOpenKey].newValue
                    });
                }
            });
        });

        /* Get the currently open tab information */
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            this.setState({ tabInfo: tabs[0] }, () => {
                /* Sync auth session of popup.html with chatbox iframe */
                Auth.currentSession()
                    .then(session => {
                        const authState = {
                            username: session.idToken.payload['cognito:username'],
                            email: session.idToken.payload['email']
                        };
                        this.setState({ authState: authState }, () => {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'auth-session',
                                session: session
                            });
                        });
                    })
                    .catch(() => { /* User is not authenticated */
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'auth-null'
                        });
                    });
            });
        });

        Hub.listen('auth', data => {
            const { payload } = data;
            console.log('hub payload');
            if (payload.event === 'signIn') {
                const authState = {
                    username: payload.data.username,
                    email: payload.data.attributes.email
                }
                this.setState({ authState: authState }, () => {
                    console.log('set auth state');
                });
            } else if (payload.event === 'signOut') {
                this.setState({ authState: null });
            }
        });
    }

    handleAuthModeChange = (authMode) => {
        this.setState({ authMode: authMode });
    }

    handleGoogleSignIn = () => {
        window.open('http://localhost:4200/auth-google', '_blank');
    }

    handleSignOut = () => {
        console.log('handleSignOut');
        Auth.signOut()
            .then(() => {
                console.log('auth sign out then')
                chrome.tabs.sendMessage(this.state.tabInfo.id, {
                    type: 'auth-null'
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    /* Toggle chatbox for window */
    toggleChatbox = () => {
        chrome.windows.getCurrent(window => {
            const windowChatboxOpenKey = 'windowChatboxOpen_' + window.id;
            const updatedItem = {};
            if (this.state.chatboxToggledOn) {
                updatedItem[windowChatboxOpenKey] = false;
                chrome.storage.local.set(updatedItem);
            } else {
                updatedItem[windowChatboxOpenKey] = true;
                chrome.storage.local.set(updatedItem);
            }
        });
    }

    render() {
        let authFormDiv = <div></div>;
        /* TODO
         * Implement better url matching condition 
         * https://developer.chrome.com/docs/extensions/mv3/match_patterns/
         */
        if (this.state.tabInfo) {
            if (this.state.tabInfo.url.startsWith('chrome://')) {
                authFormDiv = (
                    <div>
                        Please Switch to a Different Tab to Sign In!
                    </div>
                );
            } else if (this.state.authMode === 'sign-in') {
                authFormDiv = (
                    <SignIn
                        tabId={this.state.tabInfo.id}
                        authModeHandler={this.handleAuthModeChange}
                    />
                );
            } else if (this.state.authMode === 'sign-up') {
                authFormDiv = (
                    <SignUp />
                );
            }
        }

        return (
            <div className="App">
                {/* <div>
                    <a href="http://localhost:4200/auth" target="_blank" rel="noopener noreferrer">
                        Click to Sign into PageNow
                    </a>
                </div> */}
                { authFormDiv }
                <div>
                    <button onClick={this.handleSignOut}>SignOut</button>
                </div>
                <div>
                    <button onClick={this.handleGoogleSignIn}>Google Sign In</button>
                </div>
                <div>Logged In as {this.state.authState?.email}</div>
                <div>Chatbox display: {this.state.chatboxToggledOn}</div>
                <button onClick={this.toggleChatbox}>
                    {this.state.chatboxToggledOn ? "Close Chatbox" : "Open Chatbox"}
                </button>
                
            </div>
        );
    }
}

export default App;

/* TODOs
 * Message for non webpage tabs - login does not work. - After Chrome version 37
 */

/* References
 * https://stackoverflow.com/questions/44968953/how-to-create-a-login-using-google-in-chrome-extension
 */