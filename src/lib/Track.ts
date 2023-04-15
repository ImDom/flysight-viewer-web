/***************************************************************************
 **                                                                        **
 **  FlySight Viewer                                                       **
 **  Copyright 2018 Michael Cooper, Klaus Rheinwald                        **
 **                                                                        **
 **  FlySight Web Viewer                                                   **
 **  Modifications 2022 Dominik Rask                                       **
 **  2022-04-10: Port to TypeScript                                        **
 **                                                                        **
 **  This program is free software: you can redistribute it and/or modify  **
 **  it under the terms of the GNU General Public License as published by  **
 **  the Free Software Foundation, either version 3 of the License, or     **
 **  (at your option) any later version.                                   **
 **                                                                        **
 **  This program is distributed in the hope that it will be useful,       **
 **  but WITHOUT ANY WARRANTY; without even the implied warranty of        **
 **  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         **
 **  GNU General Public License for more details.                          **
 **                                                                        **
 **  You should have received a copy of the GNU General Public License     **
 **  along with this program.  If not, see <http://www.gnu.org/licenses/>. **
 **                                                                        **
 ****************************************************************************/

import Papa from 'papaparse';
import { A_GRAVITY, GAS_CONST, LAPSE_RATE, MM_AIR, SL_PRESSURE, SL_TEMP } from './constants';
import { Datapoint, RawFlysight } from './Datapoint';

enum GroundReference {
    Automatic,
    Manual,
}

interface Wind {
    east: number;
    north: number;
}

interface WindSpeedDirection {
    speed: number;
    direction: number;
}

export class Track {
    options = {
        groundReference: GroundReference.Manual,
        fixedReference: 0,
        windAdjustment: false,
        windE: 0,
        windN: 0,
        mass: 90,
        planformArea: 2,
    };

    wind?: Wind;
    ground?: number;
    course?: number;

    datapoints: Datapoint[] = [];

    importFromText(text: string): void {
        const parsed = Papa.parse<RawFlysight>(text, {
            header: true,
            skipEmptyLines: true,
        });
        parsed.data.forEach((rawPoint) => {
            if (rawPoint.gps_FixType === '0') return;
            this.datapoints.push(new Datapoint(rawPoint));
        });

        this.initTime();
        this.initAltitude();
        // this.initAcceleration();

        // this.updateVelocity(true);

        console.log('Track:', this);
    }

    initTime() {
        const start = this.datapoints[0].gpsDateTime.getTime();
        this.datapoints.forEach((point, i) => {
            const end = point.gpsDateTime.getTime();
            point.t = (end - start) / 1000;
        });
    }

    initExit() {}

    initAltitude() {
        let ground: number;

        if (this.ground) {
            ground = this.ground;
        } else if (this.options.groundReference === GroundReference.Automatic) {
            ground = this.datapoints[this.datapoints.length - 1].hMSL;
        } else {
            ground = this.options.fixedReference;
        }

        this.ground = ground;

        this.datapoints.forEach((point, i) => {
            point.z = (point.hMSL) - ground;
        });
    }

    getSlope(center: number, value: number): number {
        const min = Math.max(0, center - 4);
        const max = Math.min(this.datapoints.length - 1, center + 4);

        let sumX = 0;
        let sumY = 0;
        let sumXX = 0;
        let sumXY = 0;

        for (let i = min; i <= max; ++i) {
            const datapoint = this.datapoints[i];
            const y = value;

            sumX += datapoint.t;
            sumY += y;
            sumXX += datapoint.t * datapoint.t;
            sumXY += datapoint.t * y;
        }

        const n = max - min + 1;
        return (sumXY - (sumX * sumY) / n) / (sumXX - (sumX * sumX) / n);
    }

    getWind(): Wind {
        if (this.wind) {
            return this.wind;
        } else {
            return {
                east: this.options.windE,
                north: this.options.windN,
            };
        }
    }

    getWindSpeedDirection(): WindSpeedDirection {
        const wind = this.getWind();
        const speed = Math.sqrt(wind.east * wind.east + wind.north * wind.north);
        let direction = Math.atan2(-wind.east, -wind.north) / Math.PI;
        if (direction < 0) direction += 360;

        return {
            speed,
            direction,
        };
    }

    findIndexBelowT(t: number) {
        let below = -1;
        let above = this.datapoints.length;

        while (below + 1 !== above) {
            const mid = Math.floor((below + above) / 2);
            const datapoint = this.datapoints[mid];

            if (datapoint.t < t) below = mid;
            else above = mid;
        }

        return below;
    }

    findIndexAboveT(t: number) {
        let below = -1;
        let above = this.datapoints.length;

        while (below + 1 !== above) {
            const mid = Math.ceil((below + above) / 2);
            const datapoint = this.datapoints[mid];

            if (datapoint.t > t) above = mid;
            else below = mid;
        }

        return above;
    }
}
