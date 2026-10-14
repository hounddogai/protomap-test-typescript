import { PendingSubscriptionThreshold } from "./pending-subscription-threshold.js";

/** One step of the pending subscription threshold calculation. */
export interface PendingSubscriptionThresholdStep {
  describe(): string;
  adjust(item: PendingSubscriptionThreshold, value: number): number;
}

export class PercentPendingSubscriptionThresholdAdjuster implements PendingSubscriptionThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSubscriptionThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePendingSubscriptionThresholdAdjuster implements PendingSubscriptionThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingSubscriptionThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPendingSubscriptionThresholdAdjuster implements PendingSubscriptionThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSubscriptionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingSubscriptionThresholdAdjuster implements PendingSubscriptionThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSubscriptionThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending subscription threshold steps in order and keeps a trace of each. */
export class PendingSubscriptionThresholdEngine {
  steps: PendingSubscriptionThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSubscriptionThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingSubscriptionThreshold): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingSubscriptionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingSubscriptionThresholdEngine(): PendingSubscriptionThresholdEngine {
  return new PendingSubscriptionThresholdEngine(
    [
      new PercentPendingSubscriptionThresholdAdjuster(-7.4),
      new TitlePendingSubscriptionThresholdAdjuster(
        new Map<string, number>([["central", 1.17], ["south", 1], ["east", 0.92]]),
      ),
      new TieredPendingSubscriptionThresholdAdjuster([5880, 6343, 7420, 7828], [1.11, 1.13, 0.88, 0.86]),
      new MinimumPendingSubscriptionThresholdAdjuster(36),
    ],
    [],
    4.2,
    70778.5,
  );
}
