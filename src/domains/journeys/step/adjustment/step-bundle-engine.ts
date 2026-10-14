import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepBundle } from "./step-bundle.js";

/** One step of the step bundle calculation. */
export interface StepBundleStep {
  describe(): string;
  adjust(item: StepBundle, value: number): number;
}

export class TieredStepBundleAdjuster implements StepBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StepBundleGraceDaysOffsetAdjuster implements StepBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: StepBundle, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumStepBundleAdjuster implements StepBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStepBundleAdjuster implements StepBundleStep {
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

  adjust(item: StepBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStepBundleAdjuster implements StepBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step bundle steps in order and keeps a trace of each. */
export class StepBundleEngine {
  steps: StepBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StepBundle): number {
    let current = item.netLoad();
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

  evaluateAll(items: StepBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStepBundleEngine(flagsValue: flags.Registry): StepBundleEngine {
  return new StepBundleEngine(
    [
      new TieredStepBundleAdjuster([4485, 5700, 8558], [1.13, 1.09, 1.13]),
      new StepBundleGraceDaysOffsetAdjuster(1.05),
      new MinimumStepBundleAdjuster(7.7),
      new FlaggedStepBundleAdjuster(flagsValue, "step-bundle-weighted", 5.6),
      new CapStepBundleAdjuster(41513),
    ],
    [],
    4.7,
    33798.6,
  );
}
