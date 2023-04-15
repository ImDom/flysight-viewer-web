import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { useRerender } from '@react-hookz/web';

import { Track } from './lib/Track';
import { Map } from './Map';
import { Unit } from './lib/types';
import { Chart } from './Chart2';

import styles from './App.module.css';
import { Load } from './Load';

import devCsv from './test.csv?raw';

export const App: React.VFC = Sentry.withErrorBoundary(
    Sentry.withProfiler(() => {
        const rerender = useRerender();
        const trackRef = useRef<Track>();

        const [activeDatapointIndex, setActiveDatapointIndex] = useState<number | null>(null);
        const [csv, setCsv] = useState<string | null>(import.meta.env.DEV && false ? devCsv : null);
        const [unit, setUnit] = useState(Unit.Imperial);

        useEffect(() => {
            if (trackRef.current || !csv) return;
            const track = new Track();
            track.importFromText(csv);

            trackRef.current = track;
            rerender();

            return () => {
                trackRef.current = undefined;
            };
        }, [csv]);

        return (
            <div className={styles.App}>
                {trackRef.current ? (
                    <div className={styles.ChartMap}>
                        <Helmet>
                            <meta name="theme-color" content="#fff" />
                        </Helmet>
                        <Chart
                            track={trackRef.current}
                            unit={unit}
                            setActiveDatapointIndex={(index) => setActiveDatapointIndex(index)}
                        />
                        <Map track={trackRef.current} activeDatapointIndex={activeDatapointIndex} />
                    </div>
                ) : (
                    <Load
                        onLoad={(newCsv) => {
                            trackRef.current = undefined;
                            setCsv(newCsv);
                        }}
                        setUnit={setUnit}
                    />
                )}
            </div>
        );
    }),
    {
        showDialog: true,
    }
);
