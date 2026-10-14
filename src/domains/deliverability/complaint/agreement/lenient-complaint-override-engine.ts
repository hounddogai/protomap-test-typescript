import * as flags from "../../../../kit/flags.js";
import { LenientComplaintOverride } from "./lenient-complaint-override.js";

/** One step of the lenient complaint override calculation. */
export interface LenientComplaintOverrideFactor {
  describe(): string;
  adjust(item: LenientComplaintOverride, value: number): number;
}

export class LenientComplaintOverrideQuantityOffsetAdjuster implements LenientComplaintOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: LenientComplaintOverride, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedLenientComplaintOverrideAdjuster implements LenientComplaintOverrideFactor {
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

  adjust(item: LenientComplaintOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientComplaintOverrideAdjuster implements LenientComplaintOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientComplaintOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientComplaintOverrideAdjuster implements LenientComplaintOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientComplaintOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameLenientComplaintOverrideAdjuster implements LenientComplaintOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientComplaintOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientComplaintOverrideAdjuster implements LenientComplaintOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientComplaintOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient complaint override steps in order and keeps a trace of each. */
export class LenientComplaintOverrideEngine {
  steps: LenientComplaintOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientComplaintOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientComplaintOverride): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LenientComplaintOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientComplaintOverrideEngine(flagsValue: flags.Registry): LenientComplaintOverrideEngine {
  return new LenientComplaintOverrideEngine(
    [
      new LenientComplaintOverrideQuantityOffsetAdjuster(0.83),
      new FlaggedLenientComplaintOverrideAdjuster(flagsValue, "lenient-complaint-override-scheduled", -5.6),
      new PercentLenientComplaintOverrideAdjuster(24.7),
      new MinimumLenientComplaintOverrideAdjuster(31.8),
      new NameLenientComplaintOverrideAdjuster(new Map<string, number>([["retail", 0.86]])),
      new TieredLenientComplaintOverrideAdjuster([6199, 6379, 9016], [0.84, 1.2, 1.16]),
    ],
    [],
    2,
    24941.1,
  );
}
