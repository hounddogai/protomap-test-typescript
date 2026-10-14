import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalInsightReservation } from "./regional-insight-reservation.js";

/** One step of the regional insight reservation calculation. */
export interface RegionalInsightReservationAdjuster {
  describe(): string;
  adjust(item: RegionalInsightReservation, value: number): number;
}

export class FlaggedRegionalInsightReservationAdjuster implements RegionalInsightReservationAdjuster {
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

  adjust(item: RegionalInsightReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalInsightReservationAdjuster implements RegionalInsightReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalInsightReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalInsightReservationAdjuster implements RegionalInsightReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalInsightReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalInsightReservationAdjuster implements RegionalInsightReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalInsightReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional insight reservation steps in order and keeps a trace of each. */
export class RegionalInsightReservationEngine {
  steps: RegionalInsightReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInsightReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalInsightReservation): number {
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

  evaluateAll(items: RegionalInsightReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalInsightReservationEngine(flagsValue: flags.Registry): RegionalInsightReservationEngine {
  return new RegionalInsightReservationEngine(
    [
      new FlaggedRegionalInsightReservationAdjuster(flagsValue, "regional-insight-reservation-fallback", 4.9),
      new RoundingRegionalInsightReservationAdjuster(0.1),
      new MinimumRegionalInsightReservationAdjuster(0.3),
      new TieredRegionalInsightReservationAdjuster([603, 1583, 4300, 9539], [1.06, 0.84, 0.91, 0.82]),
    ],
    [],
    4,
    30994.5,
  );
}
