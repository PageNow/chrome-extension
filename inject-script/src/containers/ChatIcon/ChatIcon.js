/* global chrome */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-Draggable';

import './ChatIcon.css';
import iconImg from '../../logo192.png';

let isDragging = false;

function ChatIcon () {
    const [ windowId, setWindowId ] = useState(-1);
    const [ showChatIcon, setShowChatIcon ] = useState(true);
    useEffect(() => {
        chrome.storage.local.get(['showChatIcon'], res => {
            if (res.showChatIcon === undefined || res.showChatIcon === null) {
                setShowChatIcon(true);
            } else {
                setShowChatIcon(res.showChatIcon);
            }
        });
        chrome.runtime.sendMessage({ type: 'request-window-id'}, function(res) {
            setWindowId(res.data.windowId);
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if ('showChatIcon' in changes) {
                setShowChatIcon(changes.showChatIcon.newValue);
            }
        })
    });

    const handleStart = () => {
        isDragging = false;
    }
    
    const handleDrag = () => {
        isDragging = true;
    }
    
    const handleStop = (e) => {
        if (!isDragging) {
            handleIconClick();
        }
        isDragging = false;
    }
    
    const handleIconClick = () => {
        const windowChatboxOpenKey = 'windowChatboxOpen_' + windowId;
        chrome.storage.local.get(windowChatboxOpenKey, item => {
            const updatedItem = {}
            updatedItem[windowChatboxOpenKey] = !item[windowChatboxOpenKey];
            chrome.storage.local.set(updatedItem);
        });
    }

    if (showChatIcon) {
        return (
            <Draggable onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
                <span className="pagenow-chat-icon-span">
                    <img alt='Chat Icon' src={iconImg} draggable="false"
                         style={{display: 'none'}}/>
                </span>
            </Draggable>
        );
    } else {
        return <span />
    }
}

export default ChatIcon;