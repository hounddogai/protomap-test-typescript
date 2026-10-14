import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackModelReservation } from "./fallback-model-reservation.js";

/** One step of the fallback model reservation calculation. */
export interface FallbackModelReservationFactor {
  describe(): string;
  adjust(item: FallbackModelReservation, value: number): number;
}

export class TieredFallbackModelReservationAdjuster implements FallbackModelReservationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackModelReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackModelReservationAdjuster implements FallbackModelReservationFactor {
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

  adjust(item: FallbackModelReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackModelReservationAdjuster implements FallbackModelReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackModelReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackModelReservationAdjuster implements FallbackModelReservationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackModelReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackModelReservationAdjuster implements FallbackModelReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackModelReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback model reservation steps in order and keeps a trace of each. */
export class FallbackModelReservationEngine {
  steps: FallbackModelReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackModelReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackModelReservation): number {
    let current = item.adjustedLoad();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackModelReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackModelReservationEngine(flagsValue: flags.Registry): FallbackModelReservationEngine {
  return new FallbackModelReservationEngine(
    [
      new TieredFallbackModelReservationAdjuster([3534, 5850, 8698, 9805], [0.93, 0.87, 0.85, 1.14]),
      new FlaggedFallbackModelReservationAdjuster(flagsValue, "fallback-model-reservation-manual", 5.4),
      new CapFallbackModelReservationAdjuster(6753),
      new MinimumFallbackModelReservationAdjuster(39.5),
      new RoundingFallbackModelReservationAdjuster(1),
    ],
    [],
    1.9,
    50264.6,
  );
}
