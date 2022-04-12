import * as Sentry from '@sentry/react';

import styles from './Load.module.css';

import csv from './test.csv?raw';

export const Load: React.VFC<{ onLoad: (csv: string) => void }> = Sentry.withProfiler(({ onLoad }) => {
    return (
        <div className={styles.Load}>
            <div className={styles.Dialog}>
                <div className={styles.DialogTitle}>Load FlySight CSV</div>

                <input
                    type="file"
                    className={styles.FileInput}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const csv = await file.text();
                            onLoad(csv);
                        }
                    }}
                />
                <a
                    href="#"
                    className={styles.Link}
                    onClick={(e) => {
                        e.preventDefault();
                        onLoad(csv);
                    }}
                >
                    Load Sample
                </a>
            </div>
        </div>
    );
});
