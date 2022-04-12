import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { Unit } from './lib/types';

import styles from './Load.module.css';

import csv from './test.csv?raw';

export const Load: React.VFC<{ onLoad: (csv: string) => void; setUnit: (unit: Unit) => void }> = Sentry.withProfiler(
    ({ onLoad, setUnit }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);

        return (
            <div className={styles.Load}>
                <Helmet>
                    <meta name="theme-color" content="#f0fbff" />
                </Helmet>

                <div className={styles.Dialog}>
                    <div className={styles.DialogTitle}>Load FlySight CSV</div>

                    <div className={styles.UnitSelect}>
                        <label htmlFor="input-unit">Units</label>
                        <select id="input-unit" onChange={(e) => setUnit(e.target.value as unknown as Unit)}>
                            <option value={Unit.Imperial}>Imperial (mph)</option>
                            <option value={Unit.Metric}>Metric (km/h)</option>
                        </select>
                    </div>

                    <div
                        className={styles.DropArea}
                        onClick={(e) => {
                            fileInputRef.current?.click();
                        }}
                    >
                        <div>Press to select file</div>
                        <input
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className={styles.FileInput}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const csv = await file.text();
                                    onLoad(csv);
                                }
                            }}
                        />
                    </div>

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
    }
);
