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

import { getDistance } from 'ol/sphere';
import { A_GRAVITY } from './constants';

export interface RawFlysight {
    rtcDate: string;
    rtcTime: string;
    gps_Date: string;
    gps_Time: string;
    gps_Lat: string;
    gps_Long: string;
    gps_Alt: string;
    gps_AltMSL: string;
    gps_SIV: string;
    gps_FixType: string;
    gps_GroundSpeed: string;
    gps_Heading: string;
    gps_pDOP: string;
    output_Hz: string;
}

export class Datapoint {
    public rtcDateTime!: Date;
    public gpsDateTime!: Date;
    public lat!: number;
    public lon!: number;
    public alt!: number;
    public hMSL!: number;
    public numSV!: number;
    public fixType!: number;
    public groundSpeed!: number;
    public heading!: number;
    public pDROP!: number;
    public outputHz!: number;

    public t!: number;
    public z!: number;

    constructor(public raw?: RawFlysight) {
        if (this.raw) {
            this.rtcDateTime = new Date(this.raw.rtcDate + ' ' + this.raw.rtcTime);
            this.gpsDateTime = new Date(this.raw.gps_Date + ' ' + this.raw.gps_Time);

            this.lat = parseFloat(this.raw.gps_Lat) / 10000000;
            this.lon = parseFloat(this.raw.gps_Long) / 10000000;
            this.hMSL = parseFloat(this.raw.gps_AltMSL) / 1000;
            this.groundSpeed = parseInt(this.raw.gps_GroundSpeed, 10) / 1000;

            this.numSV = parseInt(this.raw.gps_SIV, 10);
        }
    }

    get elevation(): number {
        return this.z;
    }

    get numberOfSatellites(): number {
        return this.numSV;
    }

    get time(): number {
        return this.t;
    }

    static getDistance(dp1: Datapoint, dp2: Datapoint): number {
        return getDistance([dp1.lat, dp1.lon], [dp2.lat, dp2.lon]);
    }

    static getBearing(dp1: Datapoint, dp2: Datapoint): number {
        const azi1 = getDistance([dp1.lat, 0], [dp2.lat, 0]);
        const azi2 = getDistance([0, dp1.lon], [0, dp2.lon]);

        return (azi1 / 180) * Math.PI;
    }
}
