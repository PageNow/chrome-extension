import React from 'react';

import styles from './AuthFooter.module.css';

const AuthFooter = () => {
    return (
        <div className={styles.footerDiv}>
            Having trouble? Try again 
            <a href="http://localhost:4200/auth/page" target="_blank" rel="noreferrer" className={styles.linkA}>
                here
            </a>
        </div>
    );
};

export default AuthFooter;