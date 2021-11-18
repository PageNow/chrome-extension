/* global chrome */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-Draggable';

import './ChatIcon.css';
import iconImg from '../../assets/PageNowIcon.png';
import iconImgNotification from '../../assets/PageNowIcon_notification.png';

let isDragging = false;

function ChatIcon () {
    const [ windowId, setWindowId ] = useState(-1);
    const [ showChatIcon, setShowChatIcon ] = useState(true);
    const [ notificationCnt, setNotificationCnt ] = useState(0);

    useEffect(() => {
        if (windowId === -1) {
            chrome.runtime.sendMessage({ type: 'request-window-id', data: 'from ChatIcon useEffect()' }, function(res) {
                setWindowId(res.data.windowId);
            });
        } else {
            const showChatIconKey = 'showChatIcon';
            chrome.storage.local.get([showChatIconKey], item => {
                // show chat icon by default when there is no value for 'showChatIcon' key in chrome storage
                setShowChatIcon(item.showChatIcon);
            });

            const notificationCntKey = 'notificationCnt';
            chrome.storage.local.get([notificationCntKey], item => {
                setNotificationCnt(item[notificationCntKey]);
            });

            
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (changes.hasOwnProperty(showChatIconKey)) {
                    setShowChatIcon(changes[showChatIconKey].newValue);
                }
                if (changes.hasOwnProperty(notificationCntKey)) {
                    setNotificationCnt(changes[notificationCntKey].newValue);
                }
            });
        }
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
                    <img alt='Chat Icon' draggable="false" style={{display: 'none'}}
                         src={notificationCnt && notificationCnt > 0 ? iconImgNotification : iconImg}
                    />
                </span>
            </Draggable>
        );
    } else {
        return <span />
    }
}

export default ChatIcon;
