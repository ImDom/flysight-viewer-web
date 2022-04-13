import { useMemo, useRef } from 'react';
import {
    CategoryScale,
    Chart as ChartJS,
    ChartData,
    ChartOptions,
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

ChartJS.register(zoomPlugin, LineController, LineElement, LinearScale, PointElement, Title, CategoryScale, Tooltip);

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

export const Chart: React.VFC<{
    track: Track;
    unit: Unit;
    setActiveDatapointIndex: (index: number | null) => void;
}> = ({ track, unit, setActiveDatapointIndex }) => {
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
    const glideRatioData = useMemo<ParsedDataType<'line'>[]>(
        () => track.datapoints.map((d, i) => ({ x: i, y: d.glideRatio })),
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

    const data: ChartData<'line', ParsedDataType<'line'>[], number> = useMemo(
        () => ({
            labels: track.datapoints.map((d, i) => i),
            datasets: [
                {
                    label: 'Elevation',
                    data: elevationData,
                    borderColor: '#000000',
                    backgroundColor: '#000000',
                    yAxisID: 'y',
                },
                {
                    label: 'Horizontal Speed',
                    data: horizontalSpeedData,
                    borderColor: '#ff0000',
                    backgroundColor: '#ff0000',
                    yAxisID: 'y1',
                },
                {
                    label: 'Vertical Speed',
                    data: verticalSpeedData,
                    borderColor: '#00ff00',
                    backgroundColor: '#00ff00',
                    yAxisID: 'y2',
                },
                {
                    label: 'Glide Ratio',
                    data: glideRatioData,
                    borderColor: '#0000ff',
                    backgroundColor: '#0000ff',
                    yAxisID: 'y3',
                },
            ],
        }),
        [elevationData, horizontalSpeedData, verticalSpeedData, glideRatioData]
    );

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
                y: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Elevation' + distanceUnitSuffix, color: '#000000' },
                    min: 0,
                    max: elevationMax,
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Horizontal Speed' + speedUnitSuffix, color: '#ff0000' },
                    min: speedMin,
                    max: speedMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Vertical Speed' + speedUnitSuffix, color: '#00ff00' },
                    min: speedMin,
                    max: speedMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
                y3: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Glide Ratio', color: '#0000ff' },
                    min: glideRatioMin,
                    max: glideRatioMax,

                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            },
        }),
        [elevationMax, speedMin, speedMax, glideRatioMin, glideRatioMax]
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
