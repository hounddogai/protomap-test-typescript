import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

/** One step of the weighted fraud check bundle calculation. */
export interface WeightedFraudCheckBundleAdjuster {
  describe(): string;
  adjust(item: WeightedFraudCheckBundle, value: number): number;
}

export class RoundingWeightedFraudCheckBundleAdjuster implements WeightedFraudCheckBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedFraudCheckBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelWeightedFraudCheckBundleAdjuster implements WeightedFraudCheckBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedFraudCheckBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedFraudCheckBundleAdjuster implements WeightedFraudCheckBundleAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedFraudCheckBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedFraudCheckBundleUpdatedAtOffsetAdjuster implements WeightedFraudCheckBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedFraudCheckBundle, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the weighted fraud check bundle steps in order and keeps a trace of each. */
export class WeightedFraudCheckBundleEngine {
  steps: WeightedFraudCheckBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFraudCheckBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedFraudCheckBundle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WeightedFraudCheckBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedFraudCheckBundleEngine(flagsValue: flags.Registry): WeightedFraudCheckBundleEngine {
  return new WeightedFraudCheckBundleEngine(
    [
      new RoundingWeightedFraudCheckBundleAdjuster(0.25),
      new LabelWeightedFraudCheckBundleAdjuster(
        new Map<string, number>([["east", 1.09], ["central", 1.22], ["north", 0.9]]),
      ),
      new FlaggedWeightedFraudCheckBundleAdjuster(flagsValue, "weighted-fraud-check-bundle-batched", -9.6),
      new WeightedFraudCheckBundleUpdatedAtOffsetAdjuster(1.88),
    ],
    [],
    1.9,
    20549.9,
  );
}
