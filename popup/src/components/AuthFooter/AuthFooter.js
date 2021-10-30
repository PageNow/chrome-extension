import React from 'react';

import styles from './AuthFooter.module.css';

const AuthFooter = () => {
    return (
        <div className={styles.footerDiv}>
            <span className={styles.footerSpan}>© 2021 PageNow</span>
        </div>
    );
};

export default AuthFooter;