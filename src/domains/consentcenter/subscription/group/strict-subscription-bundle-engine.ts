import * as numbers from "../../../../kit/numbers.js";
import { StrictSubscriptionBundle } from "./strict-subscription-bundle.js";

/** One step of the strict subscription bundle calculation. */
export interface StrictSubscriptionBundleStep {
  describe(): string;
  adjust(item: StrictSubscriptionBundle, value: number): number;
}

export class RoundingStrictSubscriptionBundleAdjuster implements StrictSubscriptionBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSubscriptionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictSubscriptionBundleAdjuster implements StrictSubscriptionBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictSubscriptionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictSubscriptionBundleCostOffsetAdjuster implements StrictSubscriptionBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: StrictSubscriptionBundle, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class NameStrictSubscriptionBundleAdjuster implements StrictSubscriptionBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictSubscriptionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict subscription bundle steps in order and keeps a trace of each. */
export class StrictSubscriptionBundleEngine {
  steps: StrictSubscriptionBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSubscriptionBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictSubscriptionBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: StrictSubscriptionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictSubscriptionBundleEngine(): StrictSubscriptionBundleEngine {
  return new StrictSubscriptionBundleEngine(
    [
      new RoundingStrictSubscriptionBundleAdjuster(5),
      new CapStrictSubscriptionBundleAdjuster(18058),
      new StrictSubscriptionBundleCostOffsetAdjuster(1.26),
      new NameStrictSubscriptionBundleAdjuster(new Map<string, number>([["south", 1.27], ["retail", 1.33]])),
    ],
    [],
    2.8,
    26995.9,
  );
}
