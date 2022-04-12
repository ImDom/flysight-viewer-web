import { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useMediaQuery } from 'react-responsive';
import { ApexOptions } from 'apexcharts';
import ApexChart from 'react-apexcharts';

import { Track } from './lib/Track';
import { Unit } from './lib/types';
import { getDistanceDisplayUnit, getSpeedDisplayUnit } from './lib/utils';

export const Chart: React.VFC<{
    track: Track;
    unit: Unit;
    setActiveDatapointIndex: (index: number | null) => void;
}> = Sentry.withProfiler(({ track, unit, setActiveDatapointIndex }) => {
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
    const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });

    const [options, setOptions] = useState<ApexOptions>({});
    const [series, setSeries] = useState<ApexAxisChartSeries>([]);

    useEffect(() => {
        const showYAxis = !isTabletOrMobile || !isPortrait;

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

        setOptions({
            chart: {
                id: 'flysight',
                type: 'line',
                animations: {
                    enabled: false,
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
                    text: 'Time (s)',
                },
                tickAmount: 5,
                labels: {
                    rotate: 0,
                },
            },
            yaxis: [
                {
                    show: showYAxis,
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
                    show: showYAxis,
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
                    show: showYAxis,
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
                    show: showYAxis,
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

        setSeries([
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
    }, [track, unit, isTabletOrMobile, isPortrait]);

    return <ApexChart options={options} series={series} width="100%" height={320} />;
});
