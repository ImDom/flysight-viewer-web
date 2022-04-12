import { useEffect, useRef } from 'react';
import { Map as OpenLayersMap, View as OpenLayersView, Feature as OpenLayersFeature } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Tile as LayerTile, Vector as LayerVector } from 'ol/layer';
import { XYZ as SourceXYZ, Vector as SourceVector } from 'ol/source';
import { Style as StyleStyle, Stroke as StyleStroke } from 'ol/style';
import { LineString as GeomLineString } from 'ol/geom';

import 'ol/ol.css';
import { Track } from './lib/Track';

export const Map: React.VFC<{ track: Track }> = ({ track }) => {
    const elRef = useRef<HTMLDivElement>(null);
    const olRef = useRef<OpenLayersMap>();

    useEffect(() => {
        if (olRef.current || !elRef.current) return;
        const firstDatapoint = track.datapoints[0];
        const map = new OpenLayersMap({
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
        map.addLayer(line);
        const extent = line.getSource()?.getExtent();
        if (extent) {
            map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
            });
        }

        olRef.current = map;
    });

    return <div style={{ width: '100%', height: '100%' }} ref={elRef} />;
};
