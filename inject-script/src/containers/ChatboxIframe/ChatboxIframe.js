/*global chrome*/

// local storage is saved per page (i think)... resets for different pages

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { sendMsgToIframe } from '../../utils/iframe';
import './ChatboxIframe.css';

function ChatboxIframe() {
    const [chatboxOpen, setChatboxOpen] = useState(false);
    const iframeRef = useRef();

    useEffect(() => {
        //intialize chatboxOpen - chrome.tabs and chrome.windows is undefined in componentDidMount
        chrome.storage.local.get('windowId', item => {
            const windowChatboxOpenKey = 'windowChatboxOpen_' + item.windowId;
            chrome.storage.local.get(windowChatboxOpenKey, item => {
                setChatboxOpen(item[windowChatboxOpenKey]);
            });

            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (windowChatboxOpenKey in changes) {
                    setChatboxOpen(changes[windowChatboxOpenKey].newValue);
                }
            });
        });
    })

    window.chatboxIframeRef = iframeRef;
    
    return (
        <div class='chatbox-iframe-div'>
            <Rnd style={{display: chatboxOpen
                                  ? 'block' : 'none' }}
                 className='chatbox-iframe-rnd'
                 minWidth="300" minHeight="400"
                 default={{x: 0, y: 0, width: 300, height: 400}}
                 dragAxis="x">
                {window.testVariable}
                <iframe
                    allow="autoplay"
                    allowFullScreen={true}
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    title="Chatbox"
                    ref={iframeRef}
                    className="chatbox-iframe"
                    src="http://localhost:3000"
                />     
            </Rnd>
        </div>
    );
}

export default ChatboxIframe;

if (chrome && chrome.extension) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'update-tab' || message.type === 'change-tab' || message.type === 'change-window') {
            chrome.storage.local.set({ windowId: message.tabWindowId });
            sendMsgToIframe({
                type: 'update-url',
                data: {
                    url: message.tabUrl,
                    title: message.tabTitle
                }
            });
        }
        sendResponse(null);
    });
}
