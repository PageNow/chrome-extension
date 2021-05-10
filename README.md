# chrome-extension
Chrome extension code.

With javascript injection, we create iframe that hosts chatbox.

* Popup contains the code for popup.html
* Inject-script contains the code that is injected by the chrome extension.

Popup and injection scripts are built into `build/`. `build/` is uploaded to Chrome.

Note that Google accounts sign-in cannot happen in an iframe due to Google's policy. Thus, we need to set up the authentication in popup.html.