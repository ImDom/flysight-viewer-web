import { useEffect, useRef, useState } from 'react';
import { useRerender } from '@react-hookz/web';

import { Track } from './lib/Track';
import { Map } from './Map';
import { Unit } from './lib/types';
import { Chart } from './Chart';

import styles from './App.module.css';
import { Load } from './Load';

function App() {
    const rerender = useRerender();
    const trackRef = useRef<Track>();

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
                    <Chart track={trackRef.current} unit={unit} />
                    <Map track={trackRef.current} />
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
}

export default App;
