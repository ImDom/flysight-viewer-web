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
        groundReference: GroundReference.Automatic,
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
            if (!rawPoint.time) return;
            this.datapoints.push(new Datapoint(rawPoint));
        });

        this.initTime();
        this.initAltitude();
        this.initAcceleration();

        this.updateVelocity(true);

        console.log('Track:', this);
    }

    initTime() {
        const start = this.datapoints[0].dateTime.getTime();
        this.datapoints.forEach((point, i) => {
            const end = point.dateTime.getTime();
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
            point.z = point.hMSL - ground;
        });
    }

    initAcceleration() {
        this.datapoints.forEach((datapoint, i) => {
            // Acceleration
            const accelN = this.getSlope(i, datapoint.northSpeedRaw);
            const accelE = this.getSlope(i, datapoint.eastSpeedRaw);
            const accelD = this.getSlope(i, datapoint.verticalSpeed);

            // Calculate acceleration in direction of flight
            const vh = Math.sqrt(datapoint.velN * datapoint.velN + datapoint.velE * datapoint.velE);
            datapoint.ax = (accelN * datapoint.velN + accelE * datapoint.velE) / vh;

            // Calculate acceleration perpendicular to flight
            datapoint.ay = (accelE * datapoint.velN - accelN * datapoint.velE) / vh;

            // Calculate vertical acceleration
            datapoint.az = accelD;

            // Calculate total acceleration
            datapoint.amag = Math.sqrt(accelN * accelN + accelE * accelE + accelD * accelD);
        });
    }

    initAerodynamics() {
        this.datapoints.forEach((dp, i) => {
            // Acceleration
            let accelN = this.getSlope(i, dp.northSpeed);
            let accelE = this.getSlope(i, dp.eastSpeed);
            let accelD = this.getSlope(i, dp.verticalSpeed);

            // Subtract acceleration due to gravity
            accelD -= A_GRAVITY;

            // Calculate acceleration due to drag
            const vel = dp.totalSpeed;
            const proj = (accelN * dp.vy + accelE * dp.vx + accelD * dp.velD) / vel;

            const dragN = (proj * dp.vy) / vel;
            const dragE = (proj * dp.vx) / vel;
            const dragD = (proj * dp.velD) / vel;

            const accelDrag = Math.sqrt(dragN * dragN + dragE * dragE + dragD * dragD);

            // Calculate acceleration due to lift
            const liftN = accelN - dragN;
            const liftE = accelE - dragE;
            const liftD = accelD - dragD;

            const accelLift = Math.sqrt(liftN * liftN + liftE * liftE + liftD * liftD);

            // From https://en.wikipedia.org/wiki/Atmospheric_pressure#Altitude_variation
            const airPressure =
                SL_PRESSURE *
                Math.pow(1 - (LAPSE_RATE * dp.hMSL) / SL_TEMP, (A_GRAVITY * MM_AIR) / GAS_CONST / LAPSE_RATE);

            // From https://en.wikipedia.org/wiki/Lapse_rate
            const temperature = SL_TEMP - LAPSE_RATE * dp.hMSL;

            // From https://en.wikipedia.org/wiki/Density_of_air
            const airDensity = airPressure / (GAS_CONST / MM_AIR) / temperature;

            // From https://en.wikipedia.org/wiki/Dynamic_pressure
            const dynamicPressure = (airDensity * vel * vel) / 2;

            // Calculate lift and drag coefficients
            dp.lift = (this.options.mass * accelLift) / dynamicPressure / this.options.planformArea;
            dp.drag = (this.options.mass * accelDrag) / dynamicPressure / this.options.planformArea;
        });
    }

    updateVelocity(isInit: boolean = false) {
        if (this.datapoints.length === 0) return;

        const wind = this.getWind();

        if (isInit) {
            this.wind = wind;
        }

        if (this.options.windAdjustment) {
            // Wind-adjusted position
            for (let i = 0; i < this.datapoints.length; ++i) {
                const dp0 = this.interpolateDataT(0);
                const dp = this.datapoints[i];

                const distance = Datapoint.getDistance(dp0, dp, this.options.windAdjustment);
                const bearing = Datapoint.getBearing(dp0, dp, this.options.windAdjustment);

                dp.x = distance * Math.sin(bearing) - wind.east * dp.t;
                dp.y = distance * Math.cos(bearing) - wind.north * dp.t;
            }

            // Wind-adjusted velocity
            for (let i = 0; i < this.datapoints.length; ++i) {
                const dp = this.datapoints[i];

                dp.vx = dp.velE - wind.east;
                dp.vy = dp.velN - wind.north;
            }
        } else {
            // Unadjusted position
            for (let i = 0; i < this.datapoints.length; ++i) {
                const dp0 = this.interpolateDataT(0);
                const dp = this.datapoints[i];

                const distance = Datapoint.getDistance(dp0, dp, this.options.windAdjustment);
                const bearing = Datapoint.getBearing(dp0, dp, this.options.windAdjustment);

                dp.x = distance * Math.sin(bearing);
                dp.y = distance * Math.cos(bearing);
            }

            // Unadjusted velocity
            for (let i = 0; i < this.datapoints.length; ++i) {
                const dp = this.datapoints[i];

                dp.vx = dp.velE;
                dp.vy = dp.velN;
            }
        }

        // Distance measurements
        let dist2D = 0;
        let dist3D = 0;

        for (let i = 0; i < this.datapoints.length; ++i) {
            const dp = this.datapoints[i];

            if (i > 0) {
                const dpPrev = this.datapoints[i - 1];

                const dx = dp.x - dpPrev.x;
                const dy = dp.y - dpPrev.y;
                const dh = Math.sqrt(dx * dx + dy * dy);
                const dz = dp.hMSL - dpPrev.hMSL;

                dist2D += dh;
                dist3D += Math.sqrt(dh * dh + dz * dz);
            }

            dp.dist2D = dist2D;
            dp.dist3D = dist3D;
        }

        // Adjust for exit
        const dp0 = this.interpolateDataT(0);

        for (let i = 0; i < this.datapoints.length; ++i) {
            const dp = this.datapoints[i];

            dp.x -= dp0.x;
            dp.y -= dp0.y;

            dp.dist2D -= dp0.dist2D;
            dp.dist3D -= dp0.dist3D;
        }

        let theta0: number;
        if (this.course) {
            theta0 = this.course;
        } else {
            theta0 = 0;
        }

        if (isInit) {
            this.course = theta0;
        }

        // Cumulative heading
        let prevHeading = 0;
        let firstHeading = true;

        for (let i = 0; i < this.datapoints.length; ++i) {
            const dp = this.datapoints[i];

            // Calculate heading
            dp.heading = (Math.atan2(dp.vx, dp.vy) / Math.PI) * 180;

            // Calculate heading accuracy
            const s = dp.totalSpeed;
            if (s != 0) dp.cAcc = dp.sAcc / s;
            else dp.cAcc = 0;

            // Adjust heading
            if (!firstHeading) {
                while (dp.heading < prevHeading - 180) dp.heading += 360;
                while (dp.heading >= prevHeading + 180) dp.heading -= 360;
            }

            // Relative heading
            dp.theta = dp.heading - theta0;

            firstHeading = false;
            prevHeading = dp.heading;
        }

        // Parameters depending on velocity
        for (let i = 0; i < this.datapoints.length; ++i) {
            const dp = this.datapoints[i];

            dp.curv = this.getSlope(i, dp.diveAngle);
            dp.accel = this.getSlope(i, dp.totalSpeed);
            dp.omega = this.getSlope(i, dp.course);
        }

        // Initialize aerodynamics
        this.initAerodynamics();
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

    interpolateDataT(t: number) {
        const i1 = this.findIndexBelowT(t);
        const i2 = this.findIndexAboveT(t);

        if (i1 < 0) {
            return this.datapoints[0];
        } else if (i2 >= this.datapoints.length) {
            return this.datapoints[this.datapoints.length - 1];
        } else {
            const dp1 = this.datapoints[i1];
            const dp2 = this.datapoints[i2];
            return Datapoint.interpolate(dp1, dp2, (t - dp1.t) / (dp2.t - dp1.t));
        }
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
