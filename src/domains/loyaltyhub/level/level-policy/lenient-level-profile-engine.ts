import * as numbers from "../../../../kit/numbers.js";
import { LenientLevelProfile } from "./lenient-level-profile.js";

/** One step of the lenient level profile calculation. */
export interface LenientLevelProfileStep {
  describe(): string;
  adjust(item: LenientLevelProfile, value: number): number;
}

export class PercentLenientLevelProfileAdjuster implements LenientLevelProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientLevelProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientLevelProfileAdjuster implements LenientLevelProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientLevelProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientLevelProfileQuantityOffsetAdjuster implements LenientLevelProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: LenientLevelProfile, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingLenientLevelProfileAdjuster implements LenientLevelProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientLevelProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientLevelProfileAdjuster implements LenientLevelProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientLevelProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient level profile steps in order and keeps a trace of each. */
export class LenientLevelProfileEngine {
  steps: LenientLevelProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientLevelProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientLevelProfile): number {
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

  evaluateAll(items: LenientLevelProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientLevelProfileEngine(): LenientLevelProfileEngine {
  return new LenientLevelProfileEngine(
    [
      new PercentLenientLevelProfileAdjuster(-15.3),
      new TieredLenientLevelProfileAdjuster([1629, 2116, 2744], [1.03, 0.97, 0.9]),
      new LenientLevelProfileQuantityOffsetAdjuster(0.31),
      new RoundingLenientLevelProfileAdjuster(0.25),
      new CapLenientLevelProfileAdjuster(22234),
    ],
    [],
    4.4,
    79766.4,
  );
}
