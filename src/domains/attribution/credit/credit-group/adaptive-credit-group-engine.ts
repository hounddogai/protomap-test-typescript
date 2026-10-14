import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCreditGroup } from "./adaptive-credit-group.js";

/** One step of the adaptive credit group calculation. */
export interface AdaptiveCreditGroupAdjuster {
  describe(): string;
  adjust(item: AdaptiveCreditGroup, value: number): number;
}

export class TieredAdaptiveCreditGroupAdjuster implements AdaptiveCreditGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveCreditGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveCreditGroupAdjuster implements AdaptiveCreditGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveCreditGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveCreditGroupAdjuster implements AdaptiveCreditGroupAdjuster {
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

  adjust(item: AdaptiveCreditGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive credit group steps in order and keeps a trace of each. */
export class AdaptiveCreditGroupEngine {
  steps: AdaptiveCreditGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCreditGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveCreditGroup): number {
    let current = item.netExposure();
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

  evaluateAll(items: AdaptiveCreditGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveCreditGroupEngine(flagsValue: flags.Registry): AdaptiveCreditGroupEngine {
  return new AdaptiveCreditGroupEngine(
    [
      new TieredAdaptiveCreditGroupAdjuster([293, 5586, 6074, 7608], [0.92, 1.14, 1.19, 1.11]),
      new RoundingAdaptiveCreditGroupAdjuster(5),
      new FlaggedAdaptiveCreditGroupAdjuster(flagsValue, "adaptive-credit-group-pending", 4),
    ],
    [],
    4.8,
    69241.3,
  );
}
