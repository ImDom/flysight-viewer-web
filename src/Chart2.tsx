import { useMemo, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    registerables,
    CategoryScale,
    ChartData,
    ChartOptions,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    ParsedDataType,
    Plugin,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

import { Track } from './lib/Track';
import { Unit } from './lib/types';

import styles from './Chart2.module.css';
import { getDistanceDisplayUnit, getSpeedDisplayUnit } from './lib/utils';
import { useMediaQuery } from 'react-responsive';

// ChartJS.register(
//     zoomPlugin,
//     LineController,
//     LineElement,
//     LinearScale,
//     PointElement,
//     Title,
//     CategoryScale,
//     Tooltip,
//     Legend
// );

ChartJS.register(zoomPlugin, ...registerables);

ChartJS.defaults.elements.line.borderWidth = 1;

ChartJS.defaults.elements.point.pointStyle = 'line';
ChartJS.defaults.elements.point.radius = 0;
ChartJS.defaults.elements.point.borderWidth = 0;
ChartJS.defaults.elements.point.hoverBorderWidth = 1;
ChartJS.defaults.elements.point.rotation = 90;
ChartJS.defaults.elements.point.hoverRadius = 1000;
ChartJS.defaults.elements.point.hoverBorderColor = '#000000';
ChartJS.defaults.elements.point.backgroundColor = 'rgba(0, 0, 0, 0)';
ChartJS.defaults.elements.point.borderColor = 'rgba(0, 0, 0, 0)';

// Override the 'avarage' tooltip positioner with a custom one
Tooltip.positioners.average = function (chartElements, coordinates) {
    return coordinates;
};

const COLORS = [
    '#000000',
    '#ff4500',
    '#00b400',
    '#8b4513',
    '#2f4f4f',
    '#556b2f',
    '#483d8b',
    '#0000ff',
    '#000080',
    '#9acd32',
    '#8b008b',
    '#66cdaa',
    '#ffd700',
    '#7cfc00',
    '#00fa9a',
    '#8a2be2',
    '#dc143c',
    '#00bfff',
    '#f4a460',
    '#d8bfd8',
    '#ff00ff',
    '#1e90ff',
    '#db7093',
    '#f0e68c',
    '#ff1493',
    '#ee82ee',
];

// Lots of duplication for the sake of getting feature parity quickly.
// TODO: Refactor this.

export const Chart: React.VFC<{
    track: Track;
    unit: Unit;
    setActiveDatapointIndex: (index: number | null) => void;
}> = ({ track, unit, setActiveDatapointIndex }) => {
    const [activeDatasets, setActiveDatasets] = useState({
        elevation: true,
        horizontalSpeed: true,
        verticalSpeed: true,
        totalSpeed: false,
        course: false,
        courseRate: false, // Data incorrect
        courseAccuracy: false,
        glideRatio: true,
        diveAngle: false,
        diveRate: false, // Data incorrect
        horizontalAccuracy: false,
        verticalAccuracy: false,
        speedAccuracy: false,
        numberOfSatellites: true,
        acceleration: false, // Data incorrect
        accelerationForward: false, // Data incorrect
        accelerationRight: false, // Data incorrect
        accelerationDown: false, // Data incorrect
        accelerationMagnitude: false, // Data incorrect
        totalEnergy: false,
        energyRate: false, // Data incorrect
        liftCoefficient: false, // Data incorrect
        dragCoefficient: false, // Data incorrect
    });

    const tooManyDatasetsActive = Object.values(activeDatasets).filter((d) => d).length > 5;

    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
    const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
    const isNarrow = tooManyDatasetsActive || (isTabletOrMobile && isPortrait);

    const distanceUnitSuffix = ` (${unit === Unit.Imperial ? 'ft' : 'm'})`;
    const speedUnitSuffix = ` (${unit === Unit.Imperial ? 'mph' : 'km/h'})`;

    const elevationData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getDistanceDisplayUnit(unit, d.elevation) })),
        [unit, track.datapoints]
    );
    const groundSpeedData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getSpeedDisplayUnit(unit, d.groundSpeed) })),
        [unit, track.datapoints]
    );
    const numberOfSatellitesData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.numberOfSatellites })),
        [track.datapoints]
    );

    const elevationMax = useMemo(() => Math.max(...elevationData.map((d) => d.y)), [elevationData]);
    const speedMin = useMemo(
        () =>
            Math.floor(
                Math.min(...groundSpeedData.map((d) => d.y)),
            ),
        [groundSpeedData]
    );
    const speedMax = useMemo(
        () =>
            Math.ceil(
                Math.max(...groundSpeedData.map((d) => d.y)),
            ),
        [groundSpeedData]
    );

    const data: ChartData<'line', ParsedDataType<'line'>[], number | string> = useMemo(
        () => ({
            labels: track.datapoints.map((d, i) => i),
            datasets: [
                {
                    hidden: !activeDatasets.elevation,
                    label: 'Elevation',
                    data: elevationData,
                    borderColor: COLORS[0],
                    backgroundColor: COLORS[0],
                    yAxisID: 'elevation',
                },
                {
                    hidden: !activeDatasets.elevation,
                    label: 'Ground Speed',
                    data: groundSpeedData,
                    borderColor: COLORS[1],
                    backgroundColor: COLORS[1],
                    yAxisID: 'groundSpeed',
                },
                {
                    hidden: !activeDatasets.numberOfSatellites,
                    label: 'Number of Satellites',
                    data: numberOfSatellitesData,
                    borderColor: COLORS[13],
                    backgroundColor: COLORS[13],
                    stepped: true,
                    yAxisID: 'numberOfSatellites',
                },
            ],
        }),
        [elevationData]
    );

    // @ts-ignore
    const options: ChartOptions<'line'> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            normalized: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            animation: false,
            // stacked: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (tooltipItem) => {
                            const index = tooltipItem[0].dataIndex;

                            const datapoint = track.datapoints[index];
                            const year = datapoint.gpsDateTime.getFullYear();
                            const month = datapoint.gpsDateTime.getMonth() + 1;
                            const day = datapoint.gpsDateTime.getDate();
                            const h = datapoint.gpsDateTime.getHours();
                            const m = datapoint.gpsDateTime.getMinutes();
                            const s = datapoint.gpsDateTime.getSeconds();
                            const ms = datapoint.gpsDateTime.getMilliseconds();
                            return `${year}-${month}-${day} ${h}:${m}:${s}:${ms}`;
                        },
                    },
                },
                legend: {
                    labels: {
                        boxHeight: 5,
                        boxWidth: 5,
                    },
                },
                decimation: {
                    enabled: true,
                    algorithm: 'min-max',
                },
                zoom: {
                    limits: { x: { minRange: 10 } },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: 'x',
                        drag: {
                            enabled: true,
                            modifierKey: 'shift',
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10,
                        callback: (value, index, values) => {
                            if (typeof value !== 'number') return value;
                            return `${track.datapoints[value].time}s`;
                        },
                    },
                },
                elevation: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.elevation,
                    position: 'right',
                    title: { display: true, text: 'Elevation' + distanceUnitSuffix, color: COLORS[0] },
                    min: 0,
                    max: elevationMax,
                },
                groundSpeed: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.horizontalSpeed,
                    position: 'left',
                    title: { display: true, text: 'Ground Speed' + speedUnitSuffix, color: COLORS[1] },
                    min: speedMin,
                    max: speedMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                numberOfSatellites: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.numberOfSatellites,
                    position: 'left',
                    title: { display: true, text: 'Number of Satellites', color: COLORS[13] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            },
        }),
        [isNarrow, elevationMax]
    );

    const plugins: Plugin<'line'>[] = useMemo(
        () => [
            {
                id: 'myEventCatcher',
                beforeEvent(chart, args, pluginOptions) {
                    const event = args.event;
                    if (event.type === 'mouseout') {
                        setActiveDatapointIndex(null);
                    }

                    if (event.type === 'mousemove' && event.x) {
                        const rect = chart.canvas.getBoundingClientRect();
                        var x = event.x - rect.left;
                        if (x > chart.chartArea.right) x = chart.chartArea.right;
                        const dataX = chart.scales['x'].getValueForPixel(x);
                        setActiveDatapointIndex(dataX ?? null);
                    }
                },
            },
        ],
        []
    );

    return (
        <div className={styles.Chart}>
            <Line height={300} data={data} options={options} plugins={plugins} />
        </div>
    );
};
