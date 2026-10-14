import * as flags from "../../../../kit/flags.js";
import { DefaultFraudCheckBundle } from "./default-fraud-check-bundle.js";

/** One step of the default fraud check bundle calculation. */
export interface DefaultFraudCheckBundleFactor {
  describe(): string;
  adjust(item: DefaultFraudCheckBundle, value: number): number;
}

export class FlaggedDefaultFraudCheckBundleAdjuster implements DefaultFraudCheckBundleFactor {
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

  adjust(item: DefaultFraudCheckBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultFraudCheckBundleAdjuster implements DefaultFraudCheckBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultFraudCheckBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameDefaultFraudCheckBundleAdjuster implements DefaultFraudCheckBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultFraudCheckBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultFraudCheckBundleAdjuster implements DefaultFraudCheckBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultFraudCheckBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default fraud check bundle steps in order and keeps a trace of each. */
export class DefaultFraudCheckBundleEngine {
  steps: DefaultFraudCheckBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultFraudCheckBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultFraudCheckBundle): number {
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

  evaluateAll(items: DefaultFraudCheckBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultFraudCheckBundleEngine(flagsValue: flags.Registry): DefaultFraudCheckBundleEngine {
  return new DefaultFraudCheckBundleEngine(
    [
      new FlaggedDefaultFraudCheckBundleAdjuster(flagsValue, "default-fraud-check-bundle-global", -2.1),
      new MinimumDefaultFraudCheckBundleAdjuster(32.4),
      new NameDefaultFraudCheckBundleAdjuster(new Map<string, number>([["retail", 0.8]])),
      new CapDefaultFraudCheckBundleAdjuster(35078),
    ],
    [],
    3.9,
    34045.2,
  );
}
