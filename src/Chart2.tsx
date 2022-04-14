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
        numberOfSatellites: false,
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
    const horizontalSpeedData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getSpeedDisplayUnit(unit, d.horizontalSpeed) })),
        [unit, track.datapoints]
    );
    const verticalSpeedData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getSpeedDisplayUnit(unit, d.verticalSpeed) })),
        [unit, track.datapoints]
    );
    const totalSpeedData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getSpeedDisplayUnit(unit, d.totalSpeed) })),
        [unit, track.datapoints]
    );
    const courseData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.course })),
        [track.datapoints]
    );
    const courseRateData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.courseRate })),
        [track.datapoints]
    );
    const courseAccuracyData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.courseAccuracy })),
        [track.datapoints]
    );
    const glideRatioData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.glideRatio })),
        [track.datapoints]
    );
    const diveAngleData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.diveAngle })),
        [track.datapoints]
    );
    const diveRateData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: 0 })),
        [track.datapoints]
    );
    const horizontalAccuracyData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getDistanceDisplayUnit(unit, d.horizontalAccuracy) })),
        [unit, track.datapoints]
    );
    const verticalAccuracyData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getDistanceDisplayUnit(unit, d.verticalAccuracy) })),
        [unit, track.datapoints]
    );
    const speedAccuracyData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: getSpeedDisplayUnit(unit, d.speedAccuracy) })),
        [unit, track.datapoints]
    );
    const numberOfSatellitesData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.numberOfSatellites })),
        [track.datapoints]
    );
    const accelerationData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.acceleration })),
        [track.datapoints]
    );
    const accelerationForwardData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.accForward })),
        [track.datapoints]
    );
    const accelerationRightData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.accRight })),
        [track.datapoints]
    );
    const accelerationDownData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.accDown })),
        [track.datapoints]
    );
    const accelerationMagnitudeData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.accMagnitude })),
        [track.datapoints]
    );
    const totalEnergyData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.totalEnergy })),
        [track.datapoints]
    );
    const energyRateData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.energyRate })),
        [track.datapoints]
    );
    const liftCoefficientData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.liftCoefficient })),
        [track.datapoints]
    );
    const dragCoefficientData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.dragCoefficient })),
        [track.datapoints]
    );

    const elevationMax = useMemo(() => Math.max(...elevationData.map((d) => d.y)), [elevationData]);
    const speedMin = useMemo(
        () =>
            Math.floor(
                Math.min(
                    Math.min(...horizontalSpeedData.map((d) => d.y)),
                    Math.min(...verticalSpeedData.map((d) => d.y))
                )
            ),
        [horizontalSpeedData, verticalSpeedData]
    );
    const speedMax = useMemo(
        () =>
            Math.ceil(
                Math.max(
                    Math.max(...horizontalSpeedData.map((d) => d.y)),
                    Math.max(...verticalSpeedData.map((d) => d.y))
                )
            ),
        [horizontalSpeedData, verticalSpeedData]
    );
    const glideRatioMin = useMemo(() => Math.floor(Math.min(...glideRatioData.map((d) => d.y))), [glideRatioData]);
    const glideRatioMax = useMemo(() => Math.ceil(Math.max(...glideRatioData.map((d) => d.y))), [glideRatioData]);

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
                    hidden: !activeDatasets.horizontalSpeed,
                    label: 'Horizontal Speed',
                    data: horizontalSpeedData,
                    borderColor: COLORS[1],
                    backgroundColor: COLORS[1],
                    yAxisID: 'horizontalSpeed',
                },
                {
                    hidden: !activeDatasets.verticalSpeed,
                    label: 'Vertical Speed',
                    data: verticalSpeedData,
                    borderColor: COLORS[2],
                    backgroundColor: COLORS[2],
                    yAxisID: 'verticalSpeed',
                },
                {
                    hidden: !activeDatasets.totalSpeed,
                    label: 'Total Speed',
                    data: totalSpeedData,
                    borderColor: COLORS[3],
                    backgroundColor: COLORS[3],
                    yAxisID: 'totalSpeed',
                },
                {
                    hidden: !activeDatasets.course,
                    label: 'Course',
                    data: courseData,
                    borderColor: COLORS[4],
                    backgroundColor: COLORS[4],
                    yAxisID: 'course',
                },
                // {
                //     hidden: !activeDatasets.courseRate,
                //     label: 'Course Rate',
                //     data: courseRateData,
                //     borderColor: COLORS[5],
                //     backgroundColor: COLORS[5],
                //     yAxisID: 'courseRate',
                // },
                {
                    hidden: !activeDatasets.courseAccuracy,
                    label: 'Course Accuracy',
                    data: courseAccuracyData,
                    borderColor: COLORS[6],
                    backgroundColor: COLORS[6],
                    yAxisID: 'courseAccuracy',
                },
                {
                    hidden: !activeDatasets.glideRatio,
                    label: 'Glide Ratio',
                    data: glideRatioData,
                    borderColor: COLORS[7],
                    backgroundColor: COLORS[7],
                    yAxisID: 'glideRatio',
                },
                {
                    hidden: !activeDatasets.diveAngle,
                    label: 'Dive Angle',
                    data: diveAngleData,
                    borderColor: COLORS[8],
                    backgroundColor: COLORS[8],
                    yAxisID: 'diveAngle',
                },
                // {
                //     hidden: !activeDatasets.diveRate,
                //     label: 'Dive Rate',
                //     data: diveRateData,
                //     borderColor: COLORS[9],
                //     backgroundColor: COLORS[9],
                //     yAxisID: 'diveRate',
                // },
                {
                    hidden: !activeDatasets.horizontalAccuracy,
                    label: 'Horizontal Accuracy',
                    data: horizontalAccuracyData,
                    borderColor: COLORS[10],
                    backgroundColor: COLORS[10],
                    yAxisID: 'horizontalAccuracy',
                },
                {
                    hidden: !activeDatasets.verticalAccuracy,
                    label: 'Vertical Accuracy',
                    data: verticalAccuracyData,
                    borderColor: COLORS[11],
                    backgroundColor: COLORS[11],
                    yAxisID: 'verticalAccuracy',
                },
                {
                    hidden: !activeDatasets.speedAccuracy,
                    label: 'Speed Accuracy',
                    data: speedAccuracyData,
                    borderColor: COLORS[12],
                    backgroundColor: COLORS[12],
                    yAxisID: 'speedAccuracy',
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
                // {
                //     hidden: !activeDatasets.acceleration,
                //     label: 'Acceleration',
                //     data: accelerationData,
                //     borderColor: COLORS[14],
                //     backgroundColor: COLORS[14],
                //     yAxisID: 'acceleration',
                // },
                // {
                //     hidden: !activeDatasets.accelerationForward,
                //     label: 'Acceleration Forward',
                //     data: accelerationForwardData,
                //     borderColor: COLORS[15],
                //     backgroundColor: COLORS[15],
                //     yAxisID: 'accelerationForward',
                // },
                // {
                //     hidden: !activeDatasets.accelerationRight,
                //     label: 'Acceleration Right',
                //     data: accelerationRightData,
                //     borderColor: COLORS[16],
                //     backgroundColor: COLORS[16],
                //     yAxisID: 'accelerationRight',
                // },
                // {
                //     hidden: !activeDatasets.accelerationDown,
                //     label: 'Acceleration Down',
                //     data: accelerationDownData,
                //     borderColor: COLORS[17],
                //     backgroundColor: COLORS[17],
                //     yAxisID: 'accelerationDown',
                // },
                // {
                //     hidden: !activeDatasets.accelerationMagnitude,
                //     label: 'Acceleration Magnitude',
                //     data: accelerationMagnitudeData,
                //     borderColor: COLORS[18],
                //     backgroundColor: COLORS[18],
                //     yAxisID: 'accelerationMagnitude',
                // },
                {
                    hidden: !activeDatasets.totalEnergy,
                    label: 'Total Energy',
                    data: totalEnergyData,
                    borderColor: COLORS[19],
                    backgroundColor: COLORS[19],
                    yAxisID: 'totalEnergy',
                },
                // {
                //     hidden: !activeDatasets.energyRate,
                //     label: 'Energy Rate',
                //     data: energyRateData,
                //     borderColor: COLORS[20],
                //     backgroundColor: COLORS[20],
                //     yAxisID: 'energyRate',
                // },
                // {
                //     hidden: !activeDatasets.liftCoefficient,
                //     label: 'Lift Coefficient',
                //     data: liftCoefficientData,
                //     borderColor: COLORS[21],
                //     backgroundColor: COLORS[21],
                //     yAxisID: 'liftCoefficient',
                // },
                // {
                //     hidden: !activeDatasets.dragCoefficient,
                //     label: 'Drag Coefficient',
                //     data: dragCoefficientData,
                //     borderColor: COLORS[22],
                //     backgroundColor: COLORS[22],
                //     yAxisID: 'dragCoefficient',
                // },
            ],
        }),
        [elevationData, horizontalSpeedData, verticalSpeedData, glideRatioData]
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
                            const year = datapoint.dateTime.getFullYear();
                            const month = datapoint.dateTime.getMonth() + 1;
                            const day = datapoint.dateTime.getDate();
                            const h = datapoint.dateTime.getHours();
                            const m = datapoint.dateTime.getMinutes();
                            const s = datapoint.dateTime.getSeconds();
                            const ms = datapoint.dateTime.getMilliseconds();
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
                horizontalSpeed: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.horizontalSpeed,
                    position: 'left',
                    title: { display: true, text: 'Horizontal Speed' + speedUnitSuffix, color: COLORS[1] },
                    min: speedMin,
                    max: speedMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                verticalSpeed: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.verticalSpeed,
                    position: 'left',
                    title: { display: true, text: 'Vertical Speed' + speedUnitSuffix, color: COLORS[2] },
                    min: speedMin,
                    max: speedMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                totalSpeed: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.totalSpeed,
                    position: 'left',
                    title: { display: true, text: 'Total Speed' + speedUnitSuffix, color: COLORS[3] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                course: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.course,
                    position: 'left',
                    title: { display: true, text: 'Course', color: COLORS[4] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                courseRate: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.courseRate,
                    position: 'left',
                    title: { display: true, text: 'Course Rate', color: COLORS[5] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                courseAccuracy: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.courseAccuracy,
                    position: 'left',
                    title: { display: true, text: 'Course Accuracy', color: COLORS[6] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                glideRatio: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.glideRatio,
                    position: 'left',
                    title: { display: true, text: 'Glide Ratio', color: COLORS[7] },
                    min: glideRatioMin,
                    max: glideRatioMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                diveAngle: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.diveAngle,
                    position: 'left',
                    title: { display: true, text: 'Dive Angle', color: COLORS[8] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                diveRate: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.diveRate,
                    position: 'left',
                    title: { display: true, text: 'Dive Rate', color: COLORS[9] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                horizontalAccuracy: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.horizontalAccuracy,
                    position: 'left',
                    title: { display: true, text: 'Horizontal Accuracy' + distanceUnitSuffix, color: COLORS[10] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                verticalAccuracy: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.verticalAccuracy,
                    position: 'left',
                    title: { display: true, text: 'Vertical Accuracy' + distanceUnitSuffix, color: COLORS[11] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                speedAccuracy: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.speedAccuracy,
                    position: 'left',
                    title: { display: true, text: 'Speed Accuracy' + speedUnitSuffix, color: COLORS[12] },
                    bounds: 'data',

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
                acceleration: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.acceleration,
                    position: 'left',
                    title: { display: true, text: 'Acceleration (m/s^2)', color: COLORS[14] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                accelerationForward: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.accelerationForward,
                    position: 'left',
                    title: { display: true, text: 'Acceleration Forward (m/s^2)', color: COLORS[15] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                accelerationRight: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.accelerationRight,
                    position: 'left',
                    title: { display: true, text: 'Acceleration Right (m/s^2)', color: COLORS[16] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                accelerationDown: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.accelerationDown,
                    position: 'left',
                    title: { display: true, text: 'Acceleration Down (m/s^2)', color: COLORS[17] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                accelerationMagnitude: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.accelerationMagnitude,
                    position: 'left',
                    title: { display: true, text: 'Acceleration Magnitude (m/s^2)', color: COLORS[18] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                totalEnergy: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.totalEnergy,
                    position: 'left',
                    title: { display: true, text: 'Total Energy (J/kg)', color: COLORS[19] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                energyRate: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.energyRate,
                    position: 'left',
                    title: { display: true, text: 'Energy Rate (J/kg/s)', color: COLORS[20] },

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                liftCoefficient: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.liftCoefficient,
                    position: 'left',
                    title: { display: true, text: 'Lift Coefficient', color: COLORS[21] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                dragCoefficient: {
                    type: 'linear',
                    display: !isNarrow && activeDatasets.dragCoefficient,
                    position: 'left',
                    title: { display: true, text: 'Drag Coefficient', color: COLORS[22] },
                    bounds: 'data',

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            },
        }),
        [isNarrow, elevationMax, speedMin, speedMax, glideRatioMin, glideRatioMax]
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
