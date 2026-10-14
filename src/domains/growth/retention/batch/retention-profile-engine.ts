import { RetentionProfile } from "./retention-profile.js";

/** One step of the retention profile calculation. */
export interface RetentionProfileStep {
  describe(): string;
  adjust(item: RetentionProfile, value: number): number;
}

export class TieredRetentionProfileAdjuster implements RetentionProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRetentionProfileAdjuster implements RetentionProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRetentionProfileAdjuster implements RetentionProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention profile steps in order and keeps a trace of each. */
export class RetentionProfileEngine {
  steps: RetentionProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionProfile): number {
    let current = item.netExposure();
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

  evaluateAll(items: RetentionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionProfileEngine(): RetentionProfileEngine {
  return new RetentionProfileEngine(
    [
      new TieredRetentionProfileAdjuster([620, 5496, 8412], [0.91, 0.93, 1.14]),
      new CapRetentionProfileAdjuster(2842),
      new PercentRetentionProfileAdjuster(4.3),
    ],
    [],
    3.8,
    78088.9,
  );
}
