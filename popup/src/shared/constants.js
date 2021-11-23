/*global chrome*/
export const SHARING_WARNING_MAP = {
    'google.com': chrome.i18n.getMessage("googleWarningMessage"),
    'messenger.com': chrome.i18n.getMessage("messengerWarningMessage"),
    'notion.so': chrome.i18n.getMessage("notionWarningMessage"),
    'facebook.com': chrome.i18n.getMessage("facebookWarningMessage"),
    'instagram.com': chrome.i18n.getMessage("instagramWarningMessage")
};
