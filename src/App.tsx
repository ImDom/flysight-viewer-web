import { useEffect, useRef, useState } from 'react';
import Chart from 'react-apexcharts';
import Papa from 'papaparse';

import { Track } from './lib/Track';
import { Datapoint, RawFlysight } from './lib/Datapoint';

import csv from './test.csv?raw';

import './App.css';
import { Map } from './Map';

const track = new Track();
track.importFromText(csv);

export enum Unit {
    Matric,
    Imperial,
}

function metersToFeet(metric: number): number {
    return metric * 3.28084;
}

function mpsToKmh(mps: number): number {
    return mps * 3.6;
}

function kmhToMph(metric: number): number {
    return metric * 0.6213711922;
}

function getDistanceDisplayUnit(unit: Unit, value: number): number {
    return unit === Unit.Imperial ? metersToFeet(value) : value;
}

function getSpeedDisplayUnit(unit: Unit, value: number): number {
    value = mpsToKmh(value);
    return unit === Unit.Imperial ? kmhToMph(value) : value;
}

function App() {
    console.log('Render App');
    const [unit, setUnit] = useState(Unit.Imperial);

    const distanceUnitSuffix = ` (${unit === Unit.Imperial ? 'ft' : 'm'})`;
    const speedUnitSuffix = ` (${unit === Unit.Imperial ? 'mph' : 'km/h'})`;

    const elevations = track.datapoints.map((d) => getDistanceDisplayUnit(unit, d.elevation));
    const horizontalSpeeds = track.datapoints.map((d) => getSpeedDisplayUnit(unit, d.horizontalSpeed));
    const verticalSpeeds = track.datapoints.map((d) => getSpeedDisplayUnit(unit, d.verticalSpeed));
    const glideRatios = track.datapoints.map((d) => d.glideRatio);

    const speedMin = Math.floor(Math.min(Math.min(...horizontalSpeeds), Math.min(...verticalSpeeds)));
    const speedMax = Math.ceil(Math.max(Math.max(...horizontalSpeeds), Math.max(...verticalSpeeds)));
    const glideRatioMin = Math.floor(Math.min(...glideRatios));
    const glideRatioMax = Math.ceil(Math.max(...glideRatios));

    const [options, setOptions] = useState<ApexCharts.ApexOptions>({
        chart: {
            id: 'flysight',
            type: 'line',
            animations: {
                enabled: false,
            },
        },
        xaxis: {
            type: 'numeric',
            categories: track.datapoints.map((d) => d.t),
            title: {
                text: 'Time (s)',
            },
        },
        yaxis: [
            {
                title: {
                    text: 'Elevation' + distanceUnitSuffix,
                    style: {
                        color: '#000000',
                    },
                },
                decimalsInFloat: 0,
                min: 0,
                max: Math.ceil(Math.max(...elevations)),
            },
            {
                title: {
                    text: 'Horizontal Speed' + speedUnitSuffix,
                    style: {
                        color: '#ff0000',
                    },
                },
                decimalsInFloat: 2,
                min: speedMin,
                max: speedMax,
            },
            {
                title: {
                    text: 'Vertical Speed' + speedUnitSuffix,
                    style: {
                        color: '#00ff00',
                    },
                },
                decimalsInFloat: 2,
                min: speedMin,
                max: speedMax,
            },
            {
                title: {
                    text: 'Glide Ratio',
                    style: {
                        color: '#0000ff',
                    },
                },
                decimalsInFloat: 4,
                min: glideRatioMin,
                max: glideRatioMax,
                tickAmount: Math.round(Math.sqrt(glideRatioMax)) * 2,
            },
        ],
        stroke: {
            curve: 'straight',
            width: 1,
        },
        tooltip: {
            followCursor: true,
        },
    });

    const [series, setseries] = useState<ApexAxisChartSeries>([
        {
            name: 'Elevation',
            data: elevations,
            color: '#000000',
        },
        {
            name: 'Horizontal Speed',
            data: horizontalSpeeds,
            color: '#ff0000',
        },
        {
            name: 'Vertical Speed',
            data: verticalSpeeds,
            color: '#00ff00',
        },
        {
            name: 'Glide Ratio',
            data: glideRatios,
            color: '#0000ff',
        },
    ]);

    return (
        <div className="App">
            <Chart options={options} series={series} width="100%" height={320} />
            <Map track={track} />
        </div>
    );
}

export default App;
