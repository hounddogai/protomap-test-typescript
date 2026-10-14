import * as flags from "../../../../kit/flags.js";
import { GlobalPreferenceRollup } from "./global-preference-rollup.js";

/** One step of the global preference rollup calculation. */
export interface GlobalPreferenceRollupStep {
  describe(): string;
  adjust(item: GlobalPreferenceRollup, value: number): number;
}

export class FlaggedGlobalPreferenceRollupAdjuster implements GlobalPreferenceRollupStep {
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

  adjust(item: GlobalPreferenceRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalPreferenceRollupSequenceOffsetAdjuster implements GlobalPreferenceRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: GlobalPreferenceRollup, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class PercentGlobalPreferenceRollupAdjuster implements GlobalPreferenceRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPreferenceRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalPreferenceRollupAdjuster implements GlobalPreferenceRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPreferenceRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentGlobalPreferenceRollupAdjuster implements GlobalPreferenceRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: GlobalPreferenceRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global preference rollup steps in order and keeps a trace of each. */
export class GlobalPreferenceRollupEngine {
  steps: GlobalPreferenceRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPreferenceRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalPreferenceRollup): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: GlobalPreferenceRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalPreferenceRollupEngine(flagsValue: flags.Registry): GlobalPreferenceRollupEngine {
  return new GlobalPreferenceRollupEngine(
    [
      new FlaggedGlobalPreferenceRollupAdjuster(flagsValue, "global-preference-rollup-tiered", -9.8),
      new GlobalPreferenceRollupSequenceOffsetAdjuster(0.84),
      new PercentGlobalPreferenceRollupAdjuster(9.4),
      new TieredGlobalPreferenceRollupAdjuster([7765, 7972], [0.88, 1.16]),
      new SegmentGlobalPreferenceRollupAdjuster(new Map<string, number>([["online", 1.05]])),
    ],
    [],
    4.4,
    70603.3,
  );
}
