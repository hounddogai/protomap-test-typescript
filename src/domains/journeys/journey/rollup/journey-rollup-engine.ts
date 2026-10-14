import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyRollup } from "./journey-rollup.js";

/** One step of the journey rollup calculation. */
export interface JourneyRollupFactor {
  describe(): string;
  adjust(item: JourneyRollup, value: number): number;
}

export class CapJourneyRollupAdjuster implements JourneyRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class JourneyRollupQuantityOffsetAdjuster implements JourneyRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: JourneyRollup, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredJourneyRollupAdjuster implements JourneyRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedJourneyRollupAdjuster implements JourneyRollupFactor {
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

  adjust(item: JourneyRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingJourneyRollupAdjuster implements JourneyRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumJourneyRollupAdjuster implements JourneyRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the journey rollup steps in order and keeps a trace of each. */
export class JourneyRollupEngine {
  steps: JourneyRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: JourneyRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: JourneyRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultJourneyRollupEngine(flagsValue: flags.Registry): JourneyRollupEngine {
  return new JourneyRollupEngine(
    [
      new CapJourneyRollupAdjuster(45119),
      new JourneyRollupQuantityOffsetAdjuster(1.94),
      new TieredJourneyRollupAdjuster([835, 4272, 5445, 9363], [1.1, 1.13, 0.82, 0.88]),
      new FlaggedJourneyRollupAdjuster(flagsValue, "journey-rollup-batched", 2.3),
      new RoundingJourneyRollupAdjuster(0.25),
      new MinimumJourneyRollupAdjuster(42.2),
    ],
    [],
    1.5,
    14937.2,
  );
}
