import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { Map as OpenLayersMap, View as OpenLayersView, Feature as OpenLayersFeature } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Tile as LayerTile, Vector as LayerVector } from 'ol/layer';
import { XYZ as SourceXYZ, Vector as SourceVector } from 'ol/source';
import { Style as StyleStyle, Stroke as StyleStroke, Circle as StyleCircle, Fill as StyleFill } from 'ol/style';
import { LineString as GeomLineString, Point as GeomPoint } from 'ol/geom';

import 'ol/ol.css';
import { Track } from './lib/Track';

export const Map: React.VFC<{ track: Track; activeDatapointIndex: number | null }> = Sentry.withProfiler(
    ({ track, activeDatapointIndex }) => {
        const elRef = useRef<HTMLDivElement>(null);
        const olRef = useRef<OpenLayersMap>();
        const dotRef = useRef<LayerVector<SourceVector>>();

        useEffect(() => {
            if (!dotRef.current && olRef.current) {
                dotRef.current = new LayerVector({
                    source: new SourceVector({
                        features: [
                            new OpenLayersFeature({
                                geometry: new GeomPoint(fromLonLat([track.datapoints[0].lon, track.datapoints[0].lat])),
                                name: 'Point',
                            }),
                        ],
                    }),
                });

                dotRef.current.setStyle(
                    new StyleStyle({
                        image: new StyleCircle({
                            fill: new StyleFill({ color: '#000000' }),
                            stroke: new StyleStroke({ color: '#ff0000', width: 2 }),
                            radius: 3,
                        }),
                    })
                );

                olRef.current.addLayer(dotRef.current);
            }

            if (dotRef.current && olRef.current && activeDatapointIndex) {
                const datapoint = track.datapoints[activeDatapointIndex];
                dotRef.current?.getSource()?.forEachFeature((feature) => {
                    const coords = datapoint ? fromLonLat([datapoint.lon, datapoint.lat]) : [0, 0];
                    (feature.getGeometry() as GeomPoint).setCoordinates(coords);
                });
            }
        }, [activeDatapointIndex]);

        useEffect(() => {
            if (olRef.current || !elRef.current) return;
            console.info('Initializing map');
            const firstDatapoint = track.datapoints[0];
            olRef.current = new OpenLayersMap({
                target: elRef.current,
                layers: [
                    new LayerTile({
                        // source: new OSM(),
                        source: new SourceXYZ({
                            // https://gis.stackexchange.com/questions/367189/satellite-image-in-openlayers
                            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                            maxZoom: 19,
                            attributions: 'ArcGIS',
                        }),
                    }),
                ],
                view: new OpenLayersView({
                    center: fromLonLat([firstDatapoint.lon, firstDatapoint.lat]),
                    zoom: 14,
                }),
            });

            var lineStyle = [
                // linestring
                new StyleStyle({
                    stroke: new StyleStroke({
                        color: '#d12710',
                        width: 2,
                    }),
                }),
            ];

            const features = track.datapoints.map((datapoint, i) => {
                let nextDatapoint = track.datapoints[i + 1];
                if (!nextDatapoint) nextDatapoint = datapoint;

                var start = fromLonLat([datapoint.lon, datapoint.lat]);
                var end = fromLonLat([nextDatapoint.lon, nextDatapoint.lat]);

                return new OpenLayersFeature({
                    geometry: new GeomLineString([start, end]),
                    name: 'Line',
                });
            });

            var line = new LayerVector({
                source: new SourceVector({
                    features,
                }),
            });

            line.setStyle(lineStyle);
            olRef.current.addLayer(line);
            const extent = line.getSource()?.getExtent();
            if (extent) {
                olRef.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                });
            }

            return () => {
                if (olRef.current) {
                    olRef.current.dispose();
                }
                olRef.current = undefined;
            };
        }, [track]);

        return <div style={{ width: '100%', height: '100%' }} ref={elRef} />;
    }
);
