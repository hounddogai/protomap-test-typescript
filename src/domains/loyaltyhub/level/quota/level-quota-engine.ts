import * as numbers from "../../../../kit/numbers.js";
import { LevelQuota } from "./level-quota.js";

/** One step of the level quota calculation. */
export interface LevelQuotaAdjuster {
  describe(): string;
  adjust(item: LevelQuota, value: number): number;
}

export class MinimumLevelQuotaAdjuster implements LevelQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLevelQuotaAdjuster implements LevelQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLevelQuotaAdjuster implements LevelQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLevelQuotaAdjuster implements LevelQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level quota steps in order and keeps a trace of each. */
export class LevelQuotaEngine {
  steps: LevelQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelQuota): number {
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

  evaluateAll(items: LevelQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelQuotaEngine(): LevelQuotaEngine {
  return new LevelQuotaEngine(
    [
      new MinimumLevelQuotaAdjuster(31.2),
      new TieredLevelQuotaAdjuster([201, 5322, 9261, 9791], [1.09, 0.84, 0.86, 0.87]),
      new RoundingLevelQuotaAdjuster(5),
      new CapLevelQuotaAdjuster(28087),
    ],
    [],
    4.1,
    38238.4,
  );
}
