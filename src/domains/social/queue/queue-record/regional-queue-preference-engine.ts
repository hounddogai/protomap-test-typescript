import { RegionalQueuePreference } from "./regional-queue-preference.js";

/** One step of the regional queue preference calculation. */
export interface RegionalQueuePreferenceStep {
  describe(): string;
  adjust(item: RegionalQueuePreference, value: number): number;
}

export class PercentRegionalQueuePreferenceAdjuster implements RegionalQueuePreferenceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalQueuePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalQueuePreferenceAdjuster implements RegionalQueuePreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalQueuePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalQueuePreferenceAdjuster implements RegionalQueuePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalQueuePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRegionalQueuePreferenceAdjuster implements RegionalQueuePreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalQueuePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional queue preference steps in order and keeps a trace of each. */
export class RegionalQueuePreferenceEngine {
  steps: RegionalQueuePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalQueuePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalQueuePreference): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: RegionalQueuePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalQueuePreferenceEngine(): RegionalQueuePreferenceEngine {
  return new RegionalQueuePreferenceEngine(
    [
      new PercentRegionalQueuePreferenceAdjuster(-2.3),
      new CapRegionalQueuePreferenceAdjuster(14305),
      new MinimumRegionalQueuePreferenceAdjuster(18.8),
      new NameRegionalQueuePreferenceAdjuster(new Map<string, number>([["west", 0.9], ["south", 1.38]])),
    ],
    [],
    1.1,
    76587.3,
  );
}
