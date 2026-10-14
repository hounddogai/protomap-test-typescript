import { PrimarySubscriptionSegment } from "./primary-subscription-segment.js";

/** One step of the primary subscription segment calculation. */
export interface PrimarySubscriptionSegmentStep {
  describe(): string;
  adjust(item: PrimarySubscriptionSegment, value: number): number;
}

export class MinimumPrimarySubscriptionSegmentAdjuster implements PrimarySubscriptionSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySubscriptionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimarySubscriptionSegmentAdjuster implements PrimarySubscriptionSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySubscriptionSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitlePrimarySubscriptionSegmentAdjuster implements PrimarySubscriptionSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimarySubscriptionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPrimarySubscriptionSegmentAdjuster implements PrimarySubscriptionSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySubscriptionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimarySubscriptionSegmentAdjuster implements PrimarySubscriptionSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySubscriptionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary subscription segment steps in order and keeps a trace of each. */
export class PrimarySubscriptionSegmentEngine {
  steps: PrimarySubscriptionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySubscriptionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimarySubscriptionSegment): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimarySubscriptionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimarySubscriptionSegmentEngine(): PrimarySubscriptionSegmentEngine {
  return new PrimarySubscriptionSegmentEngine(
    [
      new MinimumPrimarySubscriptionSegmentAdjuster(1.5),
      new TieredPrimarySubscriptionSegmentAdjuster([9010, 9957], [0.82, 0.99]),
      new TitlePrimarySubscriptionSegmentAdjuster(new Map<string, number>([["north", 1.15], ["retail", 1.19]])),
      new PercentPrimarySubscriptionSegmentAdjuster(-4.3),
      new CapPrimarySubscriptionSegmentAdjuster(48079),
    ],
    [],
    5,
    65316.6,
  );
}
