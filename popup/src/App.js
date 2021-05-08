/*global chrome*/

import React from 'react';

import './App.css';

class App extends React.Component {
    // state refreshes every time you open the popup
    state = {
        chatboxToggledOn: false,
    }

    componentDidMount() {
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
    }

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
        })
    }

    render() {
        return (
            <div className="App">
                <div>Practice</div>
                <div>Chatbox display: {this.state.chatboxToggledOn}</div>
                <button onClick={this.toggleChatbox}>
                    {this.state.chatboxToggledOn ? "Close Chatbox" : "Open Chatbox"}
                </button>
            </div>
        );
    }
}

export default App;
