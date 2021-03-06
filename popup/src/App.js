/*global chrome*/
import React from 'react';
import axios from 'axios';
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
import UserRegistration from './containers/UserRegistration/UserRegistration';
import ForgotPassword from './containers/ForgotPassword/ForgotPassword';
import ResetPassword from './containers/ResetPassword/ResetPassword';
import styles from './App.module.css';
import ConfirmUser from './components/ConfirmUser/ConfirmUser';
import { USER_API_URL, CLIENT_URL } from './shared/config';
import TabWarning from './containers/TabWarning/TabWarning';

class App extends React.Component {
    /* state refreshes every time you open the popup */
    state = {
        authState: null,
        authChecked: false, /* Flag for auth state checked */
        isUserRegistered: false, /* Flag for user registration */
        tabInfo: null,
        authMode: 'sign-up', /* sign-up, sign-in, forgot-password, reset-password, confirm-user */
        isLoading: false,
        userInputEmail: '', /* Used to retain email input for forgot password and account confirmation */
        errStatus: null,
        userInfo: null
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
                            email: session.idToken.payload['email'],
                        };

                        const httpHeaders = {
                            headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                        };
                        this.setIsLoading(true);
                        axios.get(`${USER_API_URL}/users/me`, httpHeaders)
                            .then(res => {
                                this.setState({
                                    authState: authState,
                                    authChecked: true,
                                    isUserRegistered: true,
                                    userInfo: res.data
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
                                this.setIsLoading(false);
                            })
                            .catch(err => {
                                this.setState({
                                    authState: authState,
                                    authChecked: true,
                                    isUserRegistered: false
                                }, () => { this.setIsLoading(false) });
                            });
                    })
                    .catch((err) => { /* User is not authenticated */
                        this.setState({ errStatus: err.status, isLoading: true });
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
                                    const httpHeaders = {
                                        headers: { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` }
                                    };
                                    axios.get(`${USER_API_URL}/users/me`, httpHeaders)
                                        .then(res => {
                                            this.setState({
                                                isUserRegistered: true,
                                                userInfo: res.data,
                                                isLoading: false
                                            });
                                        })
                                        .catch(err => {
                                            this.setState({
                                                isUserRegistered: false
                                            }, () => { this.setIsLoading(false) });
                                        });
                                });
                                chrome.storage.local.remove('google-auth-session');
                            } else {
                                this.setState({ authChecked: true, isLoading: false }, () => {
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
        window.open(`${CLIENT_URL}/auth/google`, '_blank');
    }

    setIsLoading = (isLoading) => {
        this.setState({ isLoading: isLoading });
    }

    setIsUserRegistered = (isUserRegistered) => {
        this.setState({ isUserRegistered: isUserRegistered });
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

    getErrorStatus = () => {
        Auth.currentAuthenticatedUser()
            .then()
            .catch(err => {
                this.setState({ errStatus: err.status })
            });        
    }

    render() {
        let popupDiv = <div></div>;
        /* TODO
         * Implement better url matching condition 
         * https://developer.chrome.com/docs/extensions/mv3/match_patterns/
         */

        if (this.state.authChecked && this.state.authState !== null) {
            if (this.state.isUserRegistered) {
                popupDiv = (
                    <Home
                        tabId={this.state.tabInfo.id}
                        email={this.state.authState.email}
                        chatboxToggledOn={this.state.chatboxToggledOn}
                        toggleChatboxHandler={this.toggleChatbox}
                        setIsLoading={this.setIsLoading}
                        userInfo={this.state.userInfo}
                    />
                );
            } else {
                popupDiv = (
                    <UserRegistration
                        setIsLoading={this.setIsLoading}
                        setIsUserRegistered={this.setIsUserRegistered}
                    />
                );
            }
        } else if (this.state.authChecked && this.state.tabInfo) {
            if (this.state.tabInfo.url.startsWith('chrome://')) {
                popupDiv = <TabWarning />;
            } else if (this.state.authMode === 'sign-in') {
                popupDiv = (
                    <SignIn
                        tabId={this.state.tabInfo.id}
                        authModeHandler={this.handleAuthModeChange}
                        setIsLoading={this.setIsLoading}
                        setIsUserRegistered={this.setIsUserRegistered}
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