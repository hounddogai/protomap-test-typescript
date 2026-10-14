import * as numbers from "../../../../kit/numbers.js";
import { ManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

/** One step of the manual subscription snapshot calculation. */
export interface ManualSubscriptionSnapshotAdjuster {
  describe(): string;
  adjust(item: ManualSubscriptionSnapshot, value: number): number;
}

export class LocaleManualSubscriptionSnapshotAdjuster implements ManualSubscriptionSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualSubscriptionSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualSubscriptionSnapshotConversionRateOffsetAdjuster implements ManualSubscriptionSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: ManualSubscriptionSnapshot, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class CapManualSubscriptionSnapshotAdjuster implements ManualSubscriptionSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualSubscriptionSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualSubscriptionSnapshotAdjuster implements ManualSubscriptionSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualSubscriptionSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentManualSubscriptionSnapshotAdjuster implements ManualSubscriptionSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualSubscriptionSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual subscription snapshot steps in order and keeps a trace of each. */
export class ManualSubscriptionSnapshotEngine {
  steps: ManualSubscriptionSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSubscriptionSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualSubscriptionSnapshot): number {
    let current = item.netLoad();
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

  evaluateAll(items: ManualSubscriptionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualSubscriptionSnapshotEngine(): ManualSubscriptionSnapshotEngine {
  return new ManualSubscriptionSnapshotEngine(
    [
      new LocaleManualSubscriptionSnapshotAdjuster(
        new Map<string, number>([["central", 0.8], ["retail", 1.16], ["south", 0.96]]),
      ),
      new ManualSubscriptionSnapshotConversionRateOffsetAdjuster(0.13),
      new CapManualSubscriptionSnapshotAdjuster(33357),
      new RoundingManualSubscriptionSnapshotAdjuster(0.5),
      new PercentManualSubscriptionSnapshotAdjuster(-19.7),
    ],
    [],
    4.2,
    42297.7,
  );
}
