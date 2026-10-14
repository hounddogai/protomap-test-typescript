import * as flags from "../../../../kit/flags.js";
import { DefaultInsightProfile } from "./default-insight-profile.js";

/** One step of the default insight profile calculation. */
export interface DefaultInsightProfileStep {
  describe(): string;
  adjust(item: DefaultInsightProfile, value: number): number;
}

export class FlaggedDefaultInsightProfileAdjuster implements DefaultInsightProfileStep {
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

  adjust(item: DefaultInsightProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitDefaultInsightProfileAdjuster implements DefaultInsightProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: DefaultInsightProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumDefaultInsightProfileAdjuster implements DefaultInsightProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultInsightProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultInsightProfileAdjuster implements DefaultInsightProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultInsightProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultInsightProfileWindowDaysOffsetAdjuster implements DefaultInsightProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: DefaultInsightProfile, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class PercentDefaultInsightProfileAdjuster implements DefaultInsightProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultInsightProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default insight profile steps in order and keeps a trace of each. */
export class DefaultInsightProfileEngine {
  steps: DefaultInsightProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultInsightProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultInsightProfile): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DefaultInsightProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultInsightProfileEngine(flagsValue: flags.Registry): DefaultInsightProfileEngine {
  return new DefaultInsightProfileEngine(
    [
      new FlaggedDefaultInsightProfileAdjuster(flagsValue, "default-insight-profile-weighted", 1.5),
      new UnitDefaultInsightProfileAdjuster(new Map<string, number>([["south", 0.96]])),
      new MinimumDefaultInsightProfileAdjuster(4),
      new TieredDefaultInsightProfileAdjuster([3516, 7164], [0.88, 1.03]),
      new DefaultInsightProfileWindowDaysOffsetAdjuster(1.15),
      new PercentDefaultInsightProfileAdjuster(-20.7),
    ],
    [],
    2.9,
    23013.6,
  );
}
