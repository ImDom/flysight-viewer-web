import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { Map as OpenLayersMap, View as OpenLayersView, Feature as OpenLayersFeature, MapBrowserEvent } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Tile as LayerTile, Vector as LayerVector } from 'ol/layer';
import { XYZ as SourceXYZ, Vector as SourceVector } from 'ol/source';
import { Style as StyleStyle, Stroke as StyleStroke, Circle as StyleCircle, Fill as StyleFill } from 'ol/style';
import { LineString as GeomLineString, Point as GeomPoint } from 'ol/geom';

import 'ol/ol.css';
import { Track } from './lib/Track';
import { Datapoint } from './lib/Datapoint';
import { useMountEffect, useRerender } from '@react-hookz/web';

export const Map: React.VFC<{
    track: Track;
    activeDatapointIndex: number | null;
}> = Sentry.withProfiler(({ track, activeDatapointIndex }) => {
    const rerender = useRerender();
    const elRef = useRef<HTMLDivElement>(null);
    const olRef = useRef<OpenLayersMap>();
    const dotRef = useRef<LayerVector<SourceVector>>();

    function moveMarkerToDatapoint(datapoint?: Datapoint) {
        dotRef.current?.getSource()?.forEachFeature((feature) => {
            const coords = datapoint ? fromLonLat([datapoint.lon, datapoint.lat]) : [0, 0];
            (feature.getGeometry() as GeomPoint).setCoordinates(coords);
        });
    }

    useEffect(() => {
        if (!dotRef.current && olRef.current) {
            console.log('Initializing marker');
            dotRef.current = new LayerVector({
                source: new SourceVector({
                    features: [
                        new OpenLayersFeature({
                            geometry: new GeomPoint([0, 0]),
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

        return () => {
            dotRef.current?.dispose();
            dotRef.current = undefined;
        };
    }, [olRef.current]);

    useEffect(() => {
        if (dotRef.current && olRef.current && activeDatapointIndex) {
            const datapoint = track.datapoints[activeDatapointIndex];
            moveMarkerToDatapoint(datapoint);
        }
    }, [activeDatapointIndex]);

    useMountEffect(() => {
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

        var line = new LayerVector({
            source: new SourceVector({
                features: track.datapoints.map((datapoint, i) => {
                    let nextDatapoint = track.datapoints[i + 1];
                    if (!nextDatapoint) nextDatapoint = datapoint;

                    var start = fromLonLat([datapoint.lon, datapoint.lat]);
                    var end = fromLonLat([nextDatapoint.lon, nextDatapoint.lat]);

                    const feature = new OpenLayersFeature({
                        geometry: new GeomLineString([start, end]),
                        name: 'Line',
                    });

                    feature.setId(i);

                    return feature;
                }),
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

        const moveMarker = (e: MapBrowserEvent<any>) => {
            if (e.dragging) return;
            olRef.current?.forEachFeatureAtPixel(
                e.pixel,
                (feature, layer) => {
                    // Return true to stop scanning
                    if (!layer) return true;

                    const featureIndex = feature.getId();
                    if (typeof featureIndex === 'number') {
                        const datapoint = track.datapoints[featureIndex];

                        moveMarkerToDatapoint(datapoint);
                        return !!datapoint;
                    }
                },
                {
                    hitTolerance: 10,
                    layerFilter: (layer) => layer === line,
                }
            );
        };

        olRef.current.on('pointermove', moveMarker);
        olRef.current?.on('singleclick', moveMarker);

        rerender();

        return () => {
            olRef.current?.dispose();
            olRef.current = undefined;
        };
    });

    return <div style={{ width: '100%', height: '100%' }} ref={elRef} />;
});
