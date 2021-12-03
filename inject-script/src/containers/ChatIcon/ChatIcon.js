/* global chrome */
import React, { useEffect, useState } from 'react';
import Draggable from 'react-Draggable';

import './ChatIcon.css';
import iconImg_0 from '../../assets/PageNowIcon.png';
import iconImg_1 from '../../assets/PageNowIcon_1.png';
import iconImg_2 from '../../assets/PageNowIcon_2.png';
import iconImg_3 from '../../assets/PageNowIcon_3.png';
import iconImg_4 from '../../assets/PageNowIcon_4.png';
import iconImg_5 from '../../assets/PageNowIcon_5.png';
import iconImg_6 from '../../assets/PageNowIcon_6.png';
import iconImg_7 from '../../assets/PageNowIcon_7.png';
import iconImg_8 from '../../assets/PageNowIcon_8.png';
import iconImg_9 from '../../assets/PageNowIcon_9.png';
import iconImg_9plus from '../../assets/PageNowIcon_9+.png';

let isDragging = false;

function ChatIcon () {
    const [ windowId, setWindowId ] = useState(-1);
    const [ showChatIcon, setShowChatIcon ] = useState(true);
    const [ notificationCnt, setNotificationCnt ] = useState(0);
    const [ isSharing, setIsSharing ] = useState(false);

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

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'update-is-sharing') {
                    setIsSharing(message.isSharing);
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

    let iconImg;
    if (notificationCnt === 0) {
        iconImg = iconImg_0;
    } else if (notificationCnt === 1) {
        iconImg = iconImg_1;
    } else if (notificationCnt === 2) {
        iconImg = iconImg_2;
    } else if (notificationCnt === 3) {
        iconImg = iconImg_3;
    } else if (notificationCnt === 4) {
        iconImg = iconImg_4;
    } else if (notificationCnt === 5) {
        iconImg = iconImg_5;
    } else if (notificationCnt === 6) {
        iconImg = iconImg_6;
    } else if (notificationCnt === 7) {
        iconImg = iconImg_7;
    } else if (notificationCnt === 8) {
        iconImg = iconImg_8;
    } else if (notificationCnt === 9) {
        iconImg = iconImg_9;
    } else if (notificationCnt > 9) {
        iconImg = iconImg_9plus;
    } else {
        iconImg = iconImg_0;
    }

    if (showChatIcon) {
        return (
            <Draggable onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
                <span className="pagenow-chat-icon-span">
                    <img alt='Chat Icon' draggable="false" style={{display: 'none'}}
                         src={iconImg} className={ isSharing ? '' : 'pagenow-chat-icon-image' }
                    />
                </span>
            </Draggable>
        );
    } else {
        return <span />
    }
}

export default ChatIcon;
