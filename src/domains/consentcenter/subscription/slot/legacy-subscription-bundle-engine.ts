import * as numbers from "../../../../kit/numbers.js";
import { LegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

/** One step of the legacy subscription bundle calculation. */
export interface LegacySubscriptionBundleStep {
  describe(): string;
  adjust(item: LegacySubscriptionBundle, value: number): number;
}

export class PercentLegacySubscriptionBundleAdjuster implements LegacySubscriptionBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacySubscriptionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacySubscriptionBundleAdjuster implements LegacySubscriptionBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacySubscriptionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacySubscriptionBundleAdjuster implements LegacySubscriptionBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySubscriptionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacySubscriptionBundleAdjuster implements LegacySubscriptionBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacySubscriptionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacySubscriptionBundleConversionRateOffsetAdjuster implements LegacySubscriptionBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: LegacySubscriptionBundle, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the legacy subscription bundle steps in order and keeps a trace of each. */
export class LegacySubscriptionBundleEngine {
  steps: LegacySubscriptionBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySubscriptionBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacySubscriptionBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LegacySubscriptionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacySubscriptionBundleEngine(): LegacySubscriptionBundleEngine {
  return new LegacySubscriptionBundleEngine(
    [
      new PercentLegacySubscriptionBundleAdjuster(20.3),
      new RoundingLegacySubscriptionBundleAdjuster(0.05),
      new TieredLegacySubscriptionBundleAdjuster([2170, 3983, 4649], [1.16, 1.02, 0.82]),
      new CapLegacySubscriptionBundleAdjuster(23360),
      new LegacySubscriptionBundleConversionRateOffsetAdjuster(0.41),
    ],
    [],
    0.6,
    13107.1,
  );
}
