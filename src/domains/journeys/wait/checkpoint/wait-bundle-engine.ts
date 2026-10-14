import * as numbers from "../../../../kit/numbers.js";
import { WaitBundle } from "./wait-bundle.js";

/** One step of the wait bundle calculation. */
export interface WaitBundleModifier {
  describe(): string;
  adjust(item: WaitBundle, value: number): number;
}

export class WaitBundleBidOffsetAdjuster implements WaitBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: WaitBundle, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingWaitBundleAdjuster implements WaitBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWaitBundleAdjuster implements WaitBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWaitBundleAdjuster implements WaitBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameWaitBundleAdjuster implements WaitBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WaitBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the wait bundle steps in order and keeps a trace of each. */
export class WaitBundleEngine {
  steps: WaitBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitBundle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WaitBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitBundleEngine(): WaitBundleEngine {
  return new WaitBundleEngine(
    [
      new WaitBundleBidOffsetAdjuster(1.29),
      new RoundingWaitBundleAdjuster(5),
      new MinimumWaitBundleAdjuster(15.8),
      new PercentWaitBundleAdjuster(24.6),
      new NameWaitBundleAdjuster(new Map<string, number>([["east", 1.03], ["south", 1.37]])),
    ],
    [],
    3.8,
    84859.7,
  );
}
