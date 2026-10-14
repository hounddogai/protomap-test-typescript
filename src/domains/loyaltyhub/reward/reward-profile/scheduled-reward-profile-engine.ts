import * as numbers from "../../../../kit/numbers.js";
import { ScheduledRewardProfile } from "./scheduled-reward-profile.js";

/** One step of the scheduled reward profile calculation. */
export interface ScheduledRewardProfileFactor {
  describe(): string;
  adjust(item: ScheduledRewardProfile, value: number): number;
}

export class RoundingScheduledRewardProfileAdjuster implements ScheduledRewardProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledRewardProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledRewardProfileAdjuster implements ScheduledRewardProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledRewardProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumScheduledRewardProfileAdjuster implements ScheduledRewardProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledRewardProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled reward profile steps in order and keeps a trace of each. */
export class ScheduledRewardProfileEngine {
  steps: ScheduledRewardProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRewardProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledRewardProfile): number {
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

  evaluateAll(items: ScheduledRewardProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledRewardProfileEngine(): ScheduledRewardProfileEngine {
  return new ScheduledRewardProfileEngine(
    [
      new RoundingScheduledRewardProfileAdjuster(0.05),
      new TieredScheduledRewardProfileAdjuster([847, 2036, 9432], [1.19, 0.81, 1.16]),
      new MinimumScheduledRewardProfileAdjuster(26.1),
    ],
    [],
    2.8,
    89190.6,
  );
}
