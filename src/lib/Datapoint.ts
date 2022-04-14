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
    time: string; // Time in ISO8601 format
    lat: string; // Latitude (degrees)
    lon: string; // Longitude (degrees)
    hMSL: string; // Height above sea level (m)
    velN: string; // Velocity north (m/s)
    velE: string; // Velocity east (m/s)
    velD: string; // Velocity down (m/s)
    hAcc: string; // Horizontal accuracy (m)
    vAcc: string; // Vertical accuracy (m)
    sAcc: string; // Speed accuracy (m/s)
    gpsFix: string; // GPS fix type (3 = 3D)
    numSV: string; // Number of satellites used in fix
}

export class Datapoint {
    public dateTime!: Date;

    public hasGeodetic!: boolean;

    public lat!: number;
    public lon!: number;
    public hMSL!: number;

    public velN!: number;
    public velE!: number;
    public velD!: number;

    public hAcc!: number;
    public vAcc!: number;
    public sAcc!: number;

    public heading!: number;
    public cAcc!: number;

    public numSV!: number;

    public t!: number;
    public x!: number;
    public y!: number;
    public z!: number;

    public dist2D!: number;
    public dist3D!: number;

    public curv!: number;
    public accel!: number;

    public ax!: number;
    public ay!: number;
    public az!: number;
    public amag!: number;

    public lift!: number;
    public drag!: number;

    public vx!: number; // Wind-corrected velocity
    public vy!: number;

    public theta!: number;
    public omega!: number;

    constructor(public raw?: RawFlysight) {
        if (this.raw) {
            this.hasGeodetic = true;

            this.dateTime = new Date(this.raw.time);

            this.lat = parseFloat(this.raw.lat);
            this.lon = parseFloat(this.raw.lon);
            this.hMSL = parseFloat(this.raw.hMSL);

            this.velN = parseFloat(this.raw.velN);
            this.velE = parseFloat(this.raw.velE);
            this.velD = parseFloat(this.raw.velD);

            this.hAcc = parseFloat(this.raw.hAcc);
            this.vAcc = parseFloat(this.raw.vAcc);
            this.sAcc = parseFloat(this.raw.sAcc);

            this.numSV = parseInt(this.raw.numSV, 10);
        }
    }

    get elevation(): number {
        return this.z;
    }

    get northSpeed(): number {
        return this.vy;
    }

    get eastSpeed(): number {
        return this.vx;
    }

    get northSpeedRaw(): number {
        return this.velN;
    }

    get eastSpeedRaw(): number {
        return this.velE;
    }

    get verticalSpeed(): number {
        return this.velD;
    }

    get horizontalSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    get totalSpeed(): number {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.velD * this.velD);
    }

    get diveAngle(): number {
        // const pi = 3.14159265359;
        return (Math.atan2(this.velD, Math.sqrt(this.vx * this.vx + this.vy * this.vy)) / Math.PI) * 180;
    }

    get curvature() {
        return this.curv;
    }

    get glideRatio(): number {
        if (this.velD != 0) return Math.sqrt(this.vx * this.vx + this.vy * this.vy) / this.velD;
        else return 0;
    }

    get horizontalAccuracy(): number {
        return this.hAcc;
    }

    get verticalAccuracy(): number {
        return this.vAcc;
    }

    get speedAccuracy(): number {
        return this.sAcc;
    }

    get numberOfSatellites(): number {
        return this.numSV;
    }

    get time(): number {
        return this.t;
    }

    get distance2D(): number {
        return this.dist2D;
    }

    get distance3D(): number {
        return this.dist3D;
    }

    get acceleration(): number {
        return this.accel;
    }

    get accForward(): number {
        return this.ax;
    }

    get accRight(): number {
        return this.ay;
    }

    get accDown(): number {
        return this.az;
    }

    get accMagnitude(): number {
        return this.amag;
    }

    get totalEnergy(): number {
        const v = this.totalSpeed;
        return (v * v) / 2 + A_GRAVITY * this.elevation;
    }

    get energyRate(): number {
        return this.totalSpeed * this.acceleration - A_GRAVITY * this.verticalSpeed;
    }

    get liftCoefficient(): number {
        return this.lift;
    }

    get dragCoefficient(): number {
        return this.drag;
    }

    get course(): number {
        return this.theta;
    }

    get courseRate(): number {
        return this.omega;
    }

    get courseAccuracy(): number {
        return this.cAcc;
    }

    static interpolate(p1: Datapoint, p2: Datapoint, a: number) {
        const ret = new Datapoint();

        const ms1 = p1.dateTime.getTime();
        const ms2 = p2.dateTime.getTime();
        ret.dateTime = new Date();
        ret.dateTime.setTime(ms1 + a * (ms2 - ms1));

        ret.hasGeodetic = p1.hasGeodetic && p2.hasGeodetic;

        ret.lat = p1.lat + a * (p2.lat - p1.lat);
        ret.lon = p1.lon + a * (p2.lon - p1.lon);
        ret.hMSL = p1.hMSL + a * (p2.hMSL - p1.hMSL);

        ret.velN = p1.velN + a * (p2.velN - p1.velN);
        ret.velE = p1.velE + a * (p2.velE - p1.velE);
        ret.velD = p1.velD + a * (p2.velD - p1.velD);

        ret.hAcc = p1.hAcc + a * (p2.hAcc - p1.hAcc);
        ret.vAcc = p1.vAcc + a * (p2.vAcc - p1.vAcc);
        ret.sAcc = p1.sAcc + a * (p2.sAcc - p1.sAcc);

        if (a < 0.5) ret.numSV = p1.numSV;
        else ret.numSV = p2.numSV;

        ret.t = p1.t + a * (p2.t - p1.t);
        ret.x = p1.x + a * (p2.x - p1.x);
        ret.y = p1.y + a * (p2.y - p1.y);
        ret.z = p1.z + a * (p2.z - p1.z);

        ret.dist2D = p1.dist2D + a * (p2.dist2D - p1.dist2D);
        ret.dist3D = p1.dist3D + a * (p2.dist3D - p1.dist3D);

        ret.curv = p1.curv + a * (p2.curv - p1.curv);
        ret.accel = p1.accel + a * (p2.accel - p1.accel);

        ret.ax = p1.ax + a * (p2.ax - p1.ax);
        ret.ay = p1.ay + a * (p2.ay - p1.ay);
        ret.az = p1.az + a * (p2.az - p1.az);
        ret.amag = p1.amag + a * (p2.amag - p1.amag);

        ret.lift = p1.lift + a * (p2.lift - p1.lift);
        ret.drag = p1.drag + a * (p2.drag - p1.drag);

        ret.heading = p1.heading + a * (p2.heading - p1.heading);
        ret.cAcc = p1.cAcc + a * (p2.cAcc - p1.cAcc);

        ret.vx = p1.vx + a * (p2.vx - p1.vx);
        ret.vy = p1.vy + a * (p2.vy - p1.vy);

        ret.theta = p1.theta + a * (p2.theta - p1.theta);
        ret.omega = p1.omega + a * (p2.omega - p1.omega);

        return ret;
    }

    static getDistance(dp1: Datapoint, dp2: Datapoint, windAdjustment: boolean): number {
        if (!windAdjustment && dp1.hasGeodetic && dp2.hasGeodetic) {
            return getDistance([dp1.lat, dp1.lon], [dp2.lat, dp2.lon]);
        } else {
            const dx = dp2.x - dp1.x;
            const dy = dp2.y - dp1.y;

            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    static getBearing(dp1: Datapoint, dp2: Datapoint, windAdjustment: boolean): number {
        if (!windAdjustment && dp1.hasGeodetic && dp2.hasGeodetic) {
            const azi1 = getDistance([dp1.lat, 0], [dp2.lat, 0]);
            const azi2 = getDistance([0, dp1.lon], [0, dp2.lon]);

            return (azi1 / 180) * Math.PI;
        } else {
            const dx = dp2.x - dp1.x;
            const dy = dp2.y - dp1.y;

            return Math.atan2(dx, dy);
        }
    }
}
