import { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useRerender } from '@react-hookz/web';

import { Track } from './lib/Track';
import { Map } from './Map';
import { Unit } from './lib/types';
import { Chart } from './Chart';

import styles from './App.module.css';
import { Load } from './Load';

export const App: React.VFC = Sentry.withErrorBoundary(
    Sentry.withProfiler(() => {
        const rerender = useRerender();
        const trackRef = useRef<Track>();

        const [activeDatapointIndex, setActiveDatapointIndex] = useState<number | null>(null);
        const [csv, setCsv] = useState<string | null>(null);
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
                    <>
                        <Chart
                            track={trackRef.current}
                            unit={unit}
                            setActiveDatapointIndex={(index) => setActiveDatapointIndex(index)}
                        />
                        <Map track={trackRef.current} activeDatapointIndex={activeDatapointIndex} />
                    </>
                ) : (
                    <Load
                        onLoad={(newCsv) => {
                            trackRef.current = undefined;
                            setCsv(newCsv);
                        }}
                    />
                )}
            </div>
        );
    }),
    {
        showDialog: true,
    }
);
