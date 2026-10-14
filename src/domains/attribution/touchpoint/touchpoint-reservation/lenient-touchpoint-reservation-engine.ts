import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientTouchpointReservation } from "./lenient-touchpoint-reservation.js";

/** One step of the lenient touchpoint reservation calculation. */
export interface LenientTouchpointReservationStep {
  describe(): string;
  adjust(item: LenientTouchpointReservation, value: number): number;
}

export class CapLenientTouchpointReservationAdjuster implements LenientTouchpointReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientTouchpointReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientTouchpointReservationAdjuster implements LenientTouchpointReservationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientTouchpointReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientTouchpointReservationAdjuster implements LenientTouchpointReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientTouchpointReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientTouchpointReservationAdjuster implements LenientTouchpointReservationStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: LenientTouchpointReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient touchpoint reservation steps in order and keeps a trace of each. */
export class LenientTouchpointReservationEngine {
  steps: LenientTouchpointReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientTouchpointReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientTouchpointReservation): number {
    let current = item.effectiveValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: LenientTouchpointReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientTouchpointReservationEngine(flagsValue: flags.Registry): LenientTouchpointReservationEngine {
  return new LenientTouchpointReservationEngine(
    [
      new CapLenientTouchpointReservationAdjuster(25559),
      new TieredLenientTouchpointReservationAdjuster([3717, 3725, 9946], [0.87, 0.99, 1.11]),
      new PercentLenientTouchpointReservationAdjuster(-24.2),
      new FlaggedLenientTouchpointReservationAdjuster(
        flagsValue,
        "lenient-touchpoint-reservation-lenient",
        -6.4,
      ),
    ],
    [],
    3.7,
    17119.5,
  );
}
