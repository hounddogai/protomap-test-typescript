import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPostRollup } from "./rolling-post-rollup.js";

/** One step of the rolling post rollup calculation. */
export interface RollingPostRollupStep {
  describe(): string;
  adjust(item: RollingPostRollup, value: number): number;
}

export class RollingPostRollupWeightOffsetAdjuster implements RollingPostRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: RollingPostRollup, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class TieredRollingPostRollupAdjuster implements RollingPostRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPostRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingPostRollupAdjuster implements RollingPostRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPostRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRollingPostRollupAdjuster implements RollingPostRollupStep {
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

  adjust(item: RollingPostRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelRollingPostRollupAdjuster implements RollingPostRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingPostRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling post rollup steps in order and keeps a trace of each. */
export class RollingPostRollupEngine {
  steps: RollingPostRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPostRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingPostRollup): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingPostRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingPostRollupEngine(flagsValue: flags.Registry): RollingPostRollupEngine {
  return new RollingPostRollupEngine(
    [
      new RollingPostRollupWeightOffsetAdjuster(0.8),
      new TieredRollingPostRollupAdjuster([5772, 6591], [1.16, 1.03]),
      new PercentRollingPostRollupAdjuster(-21),
      new FlaggedRollingPostRollupAdjuster(flagsValue, "rolling-post-rollup-weighted", 6.4),
      new ChannelRollingPostRollupAdjuster(new Map<string, number>([["online", 0.7]])),
    ],
    [],
    4.9,
    43404.9,
  );
}
