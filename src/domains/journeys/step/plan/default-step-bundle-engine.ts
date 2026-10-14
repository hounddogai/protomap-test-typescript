import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultStepBundle } from "./default-step-bundle.js";

/** One step of the default step bundle calculation. */
export interface DefaultStepBundleAdjuster {
  describe(): string;
  adjust(item: DefaultStepBundle, value: number): number;
}

export class FlaggedDefaultStepBundleAdjuster implements DefaultStepBundleAdjuster {
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

  adjust(item: DefaultStepBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultStepBundleAdjuster implements DefaultStepBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultStepBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultStepBundleAdjuster implements DefaultStepBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultStepBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultStepBundleAmountOffsetAdjuster implements DefaultStepBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: DefaultStepBundle, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the default step bundle steps in order and keeps a trace of each. */
export class DefaultStepBundleEngine {
  steps: DefaultStepBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultStepBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultStepBundle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: DefaultStepBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultStepBundleEngine(flagsValue: flags.Registry): DefaultStepBundleEngine {
  return new DefaultStepBundleEngine(
    [
      new FlaggedDefaultStepBundleAdjuster(flagsValue, "default-step-bundle-pending", 1.7),
      new PercentDefaultStepBundleAdjuster(-12.3),
      new CapDefaultStepBundleAdjuster(39919),
      new DefaultStepBundleAmountOffsetAdjuster(1.01),
    ],
    [],
    2.3,
    79442.9,
  );
}
