/* Return null if valid and warning message if invalid */
export const validateEmail = (inputStr) => {
    const emailValid = inputStr.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    if (emailValid) {
        return null;
    } else {
        return "Email has invalid format."
    }
}

/* Return null if valid and warning message if invalid */
export const validatePassword = (inputStr) => {
    if (inputStr.toUpperCase() === inputStr) {
        return "Password must have lowercase characters.";
    } else if (inputStr.toLowerCase() === inputStr) {
        return "Password must have uppercase characters.";
    } else if (!/\d/.test(inputStr)) {
        return "Password must contain a number";
    } else if (inputStr.length < 8) {
        return "Password must have at least 8 characters.";
    } else {
        return null;
    }
}