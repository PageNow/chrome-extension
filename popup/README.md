## Authentication

### Problems

1. Google Authentication does not allow Sign In from iframe.
2. Amplify Auth Federated Sign In does not fire from popup.html

### Soltuion

Open a new tab for authentication and pass the user session to Chrome extension.

### References
https://stackoverflow.com/questions/60244048/login-to-chrome-extension-via-website-with-aws-amplify