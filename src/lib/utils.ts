import { Unit } from './types';

export function metersToFeet(metric: number): number {
    return metric * 3.28084;
}

export function mpsToKmh(mps: number): number {
    return mps * 3.6;
}

export function kmhToMph(metric: number): number {
    return metric * 0.6213711922;
}

export function getDistanceDisplayUnit(unit: Unit, value: number): number {
    return unit === Unit.Imperial ? metersToFeet(value) : value;
}

export function getSpeedDisplayUnit(unit: Unit, value: number): number {
    value = mpsToKmh(value);
    return unit === Unit.Imperial ? kmhToMph(value) : value;
}
