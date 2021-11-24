/*global chrome*/

/* Return null if valid and warning message if invalid */
export const validateEmail = (inputStr) => {
    const emailValid = inputStr.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    if (emailValid) {
        return null;
    } else {
        return chrome.i18n.getMessage("emailValidationError");
    }
}

/* Return null if valid and warning message if invalid */
export const validatePassword = (inputStr) => {
    if (inputStr.toUpperCase() === inputStr) {
        return chrome.i18n.getMessage("passwordMissingLowercaseError");
    } else if (!/\d/.test(inputStr)) {
        return chrome.i18n.getMessage("passwordMissingNumberError");
    } else if (!/[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`]/.test(inputStr)) {
        return chrome.i18n.getMessage("passwordMissingSpecialCharacterError");
    } else if (inputStr.length < 8) {
        return chrome.i18n.getMessage("passwordLengthError");
    } else {
        return null;
    }
}