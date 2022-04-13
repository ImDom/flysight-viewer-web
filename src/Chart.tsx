import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useMediaQuery } from 'react-responsive';
import { ApexOptions } from 'apexcharts';
import ApexChart from 'react-apexcharts';

import { Track } from './lib/Track';
import { Unit } from './lib/types';
import { getDistanceDisplayUnit, getSpeedDisplayUnit } from './lib/utils';

import styles from './Chart.module.css';

export const Chart: React.VFC<{
    track: Track;
    unit: Unit;
    setActiveDatapointIndex: (index: number | null) => void;
}> = Sentry.withProfiler(({ track, unit, setActiveDatapointIndex }) => {
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
    const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });

    const [options, setOptions] = useState<ApexOptions | null>(null);
    const [series, setSeries] = useState<ApexAxisChartSeries | null>(null);

    const distanceUnitSuffix = ` (${unit === Unit.Imperial ? 'ft' : 'm'})`;
    const speedUnitSuffix = ` (${unit === Unit.Imperial ? 'mph' : 'km/h'})`;

    const elevations = useMemo(
        () => track.datapoints.map((d) => getDistanceDisplayUnit(unit, d.elevation)),
        [unit, track.datapoints]
    );
    const horizontalSpeeds = useMemo(
        () => track.datapoints.map((d) => getSpeedDisplayUnit(unit, d.horizontalSpeed)),
        [unit, track.datapoints]
    );
    const verticalSpeeds = useMemo(
        () => track.datapoints.map((d) => getSpeedDisplayUnit(unit, d.verticalSpeed)),
        [unit, track.datapoints]
    );
    const glideRatios = useMemo(() => track.datapoints.map((d) => d.glideRatio), [track.datapoints]);

    const speedMin = useMemo(
        () => Math.floor(Math.min(Math.min(...horizontalSpeeds), Math.min(...verticalSpeeds))),
        [horizontalSpeeds, verticalSpeeds]
    );
    const speedMax = useMemo(
        () => Math.ceil(Math.max(Math.max(...horizontalSpeeds), Math.max(...verticalSpeeds))),
        [horizontalSpeeds, verticalSpeeds]
    );
    const glideRatioMin = useMemo(() => Math.floor(Math.min(...glideRatios)), [glideRatios]);
    const glideRatioMax = useMemo(() => Math.ceil(Math.max(...glideRatios)), [glideRatios]);

    const yAxis = useMemo<ApexYAxis[]>(() => {
        const showYAxis = !isTabletOrMobile || !isPortrait;

        return [
            {
                show: showYAxis,
                seriesName: 'Elevation',
                title: {
                    text: 'Elevation' + distanceUnitSuffix,
                    style: {
                        color: '#000000',
                    },
                },
                decimalsInFloat: 0,
                min: 0,
                max: Math.ceil(Math.max(...elevations)),
                forceNiceScale: true,
                labels: {
                    formatter: (value, opts) => {
                        // If opts is of type number it means it's the non-tooltip label
                        return typeof opts === 'number' ? value.toFixed(0) : value.toFixed(2);
                    },
                },
            },
            {
                show: showYAxis,
                seriesName: 'Horizontal Speed',
                title: {
                    text: 'Horizontal Speed' + speedUnitSuffix,
                    style: {
                        color: '#ff0000',
                    },
                },
                decimalsInFloat: 2,
                min: speedMin,
                max: speedMax,
                forceNiceScale: true,
                labels: {
                    formatter: (value, opts) => {
                        return typeof opts === 'number' ? value.toFixed(0) : value.toFixed(2);
                    },
                },
            },
            {
                show: showYAxis,
                seriesName: 'Vertical Speed',
                title: {
                    text: 'Vertical Speed' + speedUnitSuffix,
                    style: {
                        color: '#00ff00',
                    },
                },
                min: speedMin,
                max: speedMax,
                forceNiceScale: true,
                labels: {
                    formatter: (value, opts) => {
                        return typeof opts === 'number' ? value.toFixed(0) : value.toFixed(2);
                    },
                },
            },
            {
                show: showYAxis,
                seriesName: 'Glide Ratio',
                title: {
                    text: 'Glide Ratio',
                    style: {
                        color: '#0000ff',
                    },
                },
                min: glideRatioMin,
                max: glideRatioMax,
                forceNiceScale: true,
                labels: {
                    formatter: (value, opts) => {
                        return typeof opts === 'number' ? value.toFixed(0) : value.toFixed(4);
                    },
                },
            },
        ];
    }, [
        isPortrait,
        isTabletOrMobile,
        distanceUnitSuffix,
        speedUnitSuffix,
        elevations,
        glideRatioMax,
        glideRatioMin,
        speedMax,
        speedMin,
    ]);

    useEffect(() => {
        setSeries([
            {
                name: 'Elevation',
                data: elevations,
                color: '#000000',
                type: 'line',
            },
            {
                name: 'Horizontal Speed',
                data: horizontalSpeeds,
                color: '#ff0000',
                type: 'line',
            },
            {
                name: 'Vertical Speed',
                data: verticalSpeeds,
                color: '#00ff00',
                type: 'line',
            },
            {
                name: 'Glide Ratio',
                data: glideRatios,
                color: '#0000ff',
                type: 'line',
            },
        ]);
    }, [elevations, horizontalSpeeds, verticalSpeeds, glideRatios]);

    useEffect(() => {
        setOptions({
            chart: {
                id: 'main',
                brush: {
                    autoScaleYaxis: false,
                },
                animations: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                    autoSelected: 'pan',
                },
                events: {
                    mouseMove: (event, chartContext, config) => {
                        setActiveDatapointIndex(config.dataPointIndex);
                    },
                    click: (event, chartContext, config) => {
                        setActiveDatapointIndex(config.dataPointIndex);
                    },
                    mouseLeave: () => {
                        setActiveDatapointIndex(null);
                    },
                },
            },
            xaxis: {
                type: 'numeric',
                categories: track.datapoints.map((d) => d.t),
                title: {
                    // text: 'Time (s)',
                },
                tickAmount: 5,
                labels: {
                    rotate: 0,
                },
            },
            yaxis: yAxis,
            stroke: {
                curve: 'straight',
                width: 1,
            },
            tooltip: {
                followCursor: true,
            },
        });
    }, [track.datapoints, yAxis]);

    return (
        <div className={styles.Chart}>
            {options && series ? <ApexChart options={options} series={series} width="100%" height={300} /> : null}
        </div>
    );
});
