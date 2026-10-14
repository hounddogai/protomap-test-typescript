import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualConversionPolicy } from "./manual-conversion-policy.js";

/** One step of the manual conversion policy calculation. */
export interface ManualConversionPolicyAdjuster {
  describe(): string;
  adjust(item: ManualConversionPolicy, value: number): number;
}

export class CapManualConversionPolicyAdjuster implements ManualConversionPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualConversionPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualConversionPolicyAdjuster implements ManualConversionPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualConversionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ManualConversionPolicyConversionRateOffsetAdjuster implements ManualConversionPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: ManualConversionPolicy, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class TieredManualConversionPolicyAdjuster implements ManualConversionPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualConversionPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedManualConversionPolicyAdjuster implements ManualConversionPolicyAdjuster {
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

  adjust(item: ManualConversionPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelManualConversionPolicyAdjuster implements ManualConversionPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualConversionPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual conversion policy steps in order and keeps a trace of each. */
export class ManualConversionPolicyEngine {
  steps: ManualConversionPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualConversionPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualConversionPolicy): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ManualConversionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualConversionPolicyEngine(flagsValue: flags.Registry): ManualConversionPolicyEngine {
  return new ManualConversionPolicyEngine(
    [
      new CapManualConversionPolicyAdjuster(6397),
      new MinimumManualConversionPolicyAdjuster(34.2),
      new ManualConversionPolicyConversionRateOffsetAdjuster(1.21),
      new TieredManualConversionPolicyAdjuster([5082, 9986], [0.93, 1.19]),
      new FlaggedManualConversionPolicyAdjuster(flagsValue, "manual-conversion-policy-seasonal", -9.4),
      new LabelManualConversionPolicyAdjuster(
        new Map<string, number>([["south", 0.98], ["north", 1.29], ["retail", 0.87]]),
      ),
    ],
    [],
    2,
    81065.7,
  );
}
