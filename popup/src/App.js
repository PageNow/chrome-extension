/*global chrome*/
import React from 'react';
import { Auth } from '@aws-amplify/auth';
import { Hub } from 'aws-amplify';
import Spinner from 'react-bootstrap/Spinner';
import {
    CognitoIdToken, 
    CognitoAccessToken, 
    CognitoRefreshToken, 
    CognitoUserSession,
    CognitoUser,
    CognitoUserPool
} from "amazon-cognito-identity-js";
import awsmobile from './aws-exports';

import SignIn from './containers/SignIn/SignIn';
import SignUp from './containers/SignUp/SignUp';
import Home from './containers/Home/Home';
import ForgotPassword from './containers/ForgotPassword/ForgotPassword';
import ResetPassword from './containers/ResetPassword/ResetPassword';
import styles from './App.module.css';
import ConfirmUser from './components/ConfirmUser/ConfirmUser';

class App extends React.Component {
    /* state refreshes every time you open the popup */
    state = {
        chatboxToggledOn: false,
        authChecked: false, /* Flag for auth state checked */
        authState: null,
        tabInfo: null,
        authMode: 'sign-up', /* sign-up, sign-in, forgot-password, reset-password, confirm-user */
        isLoading: false,
        userInputEmail: '' /* Used to retain email input for forgot password and account confirmation */
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
                            userId: session.idToken.payload['cognito:username'],
                            email: session.idToken.payload['email']
                        };
                        this.setState({
                            authState: authState,
                            authChecked: true
                        }, () => {
                            chrome.storage.local.remove('google-auth-session');
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'auth-session',
                                session: session
                            });
                            chrome.runtime.sendMessage({
                                type: 'auth-jwt',
                                data: session.getIdToken().getJwtToken()
                            });
                        });
                    })
                    .catch((err) => { /* User is not authenticated */
                        chrome.storage.local.get(['google-auth-session'], item => {
                            if (item.hasOwnProperty('google-auth-session')) {
                                const session = item['google-auth-session'];
                                const idToken = new CognitoIdToken({
                                    IdToken: session.idToken.jwtToken
                                });
                                const accessToken = new CognitoAccessToken({
                                    AccessToken: session.accessToken.jwtToken
                                });
                                const refreshToken = new CognitoRefreshToken({
                                    RefreshToken: session.refreshToken.token
                                });
                                const clockDrift = session.clockDrift;
                                const sessionData = {
                                    IdToken: idToken,
                                    AccessToken: accessToken,
                                    RefreshToken: refreshToken,
                                    ClockDrift: clockDrift
                                }

                                // Create the session
                                const userSession  = new CognitoUserSession(sessionData);
                                const userData = {
                                    Username: userSession.getIdToken().payload['cognito:username'],
                                    Pool: new CognitoUserPool({
                                        UserPoolId: awsmobile.aws_user_pools_id,
                                        ClientId: awsmobile.aws_user_pools_web_client_id
                                    })
                                };
                                // Make a new cognito user
                                const cognitoUser = new CognitoUser(userData);
                                // Attach the session to the user
                                cognitoUser.setSignInUserSession(userSession);
                                // Check to make sure it works
                                cognitoUser.getSession((err, session) => {
                                    const authState = {
                                        userId: session.idToken.payload['cognito:username'],
                                        email: session.idToken.payload['email']
                                    };
                                    this.setState({
                                        authState: authState,
                                        authChecked: true
                                    });
                                });
                                chrome.storage.local.remove('google-auth-session');
                            } else {
                                this.setState({ authChecked: true }, () => {
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        type: 'auth-null'
                                    });
                                }); 
                                chrome.storage.local.remove('auth-jwt');
                            }
                        });
                                               
                    });
            });
        });

        Hub.listen('auth', data => {
            const { payload } = data;
            if (payload.event === 'signIn') {
                const authState = {
                    userId: payload.data.username,
                    email: payload.data.attributes.email
                }
                this.setState({ authState: authState });
            } else if (payload.event === 'signOut') {
                this.setState({ authState: null });
            }
        });
    }

    handleAuthModeChange = (authMode) => {
        this.setState({ authMode: authMode });
    }

    handleGoogleSignIn = () => {
        window.open('http://localhost:4200/auth/google', '_blank');
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

    setIsLoading = (isLoading) => {
        this.setState({ isLoading: isLoading })
    }

    handleUserInputEmail = (event) => {
        this.setState({ userInputEmail: event.target.value });
    }

    setUserInputEmail = (inputStr) => {
        this.setState({ userInputEmail: inputStr });
    }

    clearUserInputEmail = () => {
        this.setState({ userInputEmail: '' });
    }

    render() {
        let popupDiv = <div></div>;
        /* TODO
         * Implement better url matching condition 
         * https://developer.chrome.com/docs/extensions/mv3/match_patterns/
         */

        if (this.state.authChecked && this.state.authState !== null) {
            popupDiv = (
                <Home
                    tabId={this.state.tabInfo.id}
                    email={this.state.authState.email}
                    chatboxToggledOn={this.state.chatboxToggledOn}
                    toggleChatboxHandler={this.toggleChatbox}
                />
            );
        } else if (this.state.authChecked && this.state.tabInfo) {
            if (this.state.tabInfo.url.startsWith('chrome://')) {
                popupDiv = (
                    <div>
                        Please Switch to a Different Tab to Sign In!
                    </div>
                );
            } else if (this.state.authMode === 'sign-in') {
                popupDiv = (
                    <SignIn
                        tabId={this.state.tabInfo.id}
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        googleSignInHandler={this.handleGoogleSignIn}
                        setUserInputEmail={this.setUserInputEmail}
                    />
                );
            } else if (this.state.authMode === 'sign-up') {
                popupDiv = (
                    <SignUp
                        tabId={this.state.tabInfo.id}
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        googleSignInHandler={this.handleGoogleSignIn}  
                    />
                );
            } else if (this.state.authMode === 'forgot-password') {
                popupDiv = (
                    <ForgotPassword
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        forgotPasswordEmail = {this.state.userInputEmail}
                        forgotPasswordEmailHandler={this.handleUserInputEmail}
                    />
                );
            } else if (this.state.authMode === 'reset-password') {
                popupDiv = (
                    <ResetPassword
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        forgotPasswordEmail = {this.state.userInputEmail}
                        clearForgotPasswordEmail={this.clearUserInputEmail}
                    />
                );
            } else if (this.state.authMode === 'confirm-user') {
                popupDiv = (
                    <ConfirmUser
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        userEmail={this.state.userInputEmail}
                    />
                )
            }
        }

        return (
            <div className="App">
                {/* <div>
                    <a href="http://localhost:4200/auth" target="_blank" rel="noopener noreferrer">
                        Click to Sign into PageNow
                    </a>
                </div> */}

                <div className={styles.modalDiv}
                    style={{display: this.state.isLoading ? 'block': 'none'}}></div>
                <Spinner className={styles.spinner} animation="border" variant="info"
                    style={{display: this.state.isLoading ? 'block': 'none'}}/>

                { popupDiv }

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

/* Bugs to be aware of
 * https://bugs.chromium.org/p/chromium/issues/detail?id=971701
 */