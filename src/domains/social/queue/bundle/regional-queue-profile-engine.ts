import * as numbers from "../../../../kit/numbers.js";
import { RegionalQueueProfile } from "./regional-queue-profile.js";

/** One step of the regional queue profile calculation. */
export interface RegionalQueueProfileStep {
  describe(): string;
  adjust(item: RegionalQueueProfile, value: number): number;
}

export class MinimumRegionalQueueProfileAdjuster implements RegionalQueueProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalQueueProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRegionalQueueProfileAdjuster implements RegionalQueueProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalQueueProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalQueueProfileAdjuster implements RegionalQueueProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalQueueProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional queue profile steps in order and keeps a trace of each. */
export class RegionalQueueProfileEngine {
  steps: RegionalQueueProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalQueueProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalQueueProfile): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RegionalQueueProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalQueueProfileEngine(): RegionalQueueProfileEngine {
  return new RegionalQueueProfileEngine(
    [
      new MinimumRegionalQueueProfileAdjuster(17.5),
      new RoundingRegionalQueueProfileAdjuster(1),
      new PercentRegionalQueueProfileAdjuster(13),
    ],
    [],
    1.7,
    45151.8,
  );
}
