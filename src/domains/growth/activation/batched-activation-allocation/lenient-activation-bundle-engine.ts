import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientActivationBundle } from "./lenient-activation-bundle.js";

/** One step of the lenient activation bundle calculation. */
export interface LenientActivationBundleStep {
  describe(): string;
  adjust(item: LenientActivationBundle, value: number): number;
}

export class CapLenientActivationBundleAdjuster implements LenientActivationBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientActivationBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientActivationBundleAdjuster implements LenientActivationBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientActivationBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientActivationBundleCapacityOffsetAdjuster implements LenientActivationBundleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: LenientActivationBundle, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedLenientActivationBundleAdjuster implements LenientActivationBundleStep {
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

  adjust(item: LenientActivationBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitLenientActivationBundleAdjuster implements LenientActivationBundleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LenientActivationBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientActivationBundleAdjuster implements LenientActivationBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientActivationBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient activation bundle steps in order and keeps a trace of each. */
export class LenientActivationBundleEngine {
  steps: LenientActivationBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientActivationBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientActivationBundle): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LenientActivationBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientActivationBundleEngine(flagsValue: flags.Registry): LenientActivationBundleEngine {
  return new LenientActivationBundleEngine(
    [
      new CapLenientActivationBundleAdjuster(21535),
      new RoundingLenientActivationBundleAdjuster(1),
      new LenientActivationBundleCapacityOffsetAdjuster(0.97),
      new FlaggedLenientActivationBundleAdjuster(flagsValue, "lenient-activation-bundle-batched", 1.9),
      new UnitLenientActivationBundleAdjuster(
        new Map<string, number>([["east", 1], ["north", 1.11], ["south", 1]]),
      ),
      new PercentLenientActivationBundleAdjuster(-10.5),
    ],
    [],
    4.4,
    84989.6,
  );
}
