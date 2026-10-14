import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalRewardRollup } from "./regional-reward-rollup.js";

/** One step of the regional reward rollup calculation. */
export interface RegionalRewardRollupFactor {
  describe(): string;
  adjust(item: RegionalRewardRollup, value: number): number;
}

export class RegionalRewardRollupQuantityOffsetAdjuster implements RegionalRewardRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RegionalRewardRollup, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class LocaleRegionalRewardRollupAdjuster implements RegionalRewardRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalRewardRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalRewardRollupAdjuster implements RegionalRewardRollupFactor {
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

  adjust(item: RegionalRewardRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalRewardRollupAdjuster implements RegionalRewardRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalRewardRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalRewardRollupAdjuster implements RegionalRewardRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalRewardRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional reward rollup steps in order and keeps a trace of each. */
export class RegionalRewardRollupEngine {
  steps: RegionalRewardRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalRewardRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalRewardRollup): number {
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

  evaluateAll(items: RegionalRewardRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalRewardRollupEngine(flagsValue: flags.Registry): RegionalRewardRollupEngine {
  return new RegionalRewardRollupEngine(
    [
      new RegionalRewardRollupQuantityOffsetAdjuster(0.84),
      new LocaleRegionalRewardRollupAdjuster(new Map<string, number>([["south", 0.85], ["north", 1.31]])),
      new FlaggedRegionalRewardRollupAdjuster(flagsValue, "regional-reward-rollup-seasonal", -3),
      new PercentRegionalRewardRollupAdjuster(4.8),
      new RoundingRegionalRewardRollupAdjuster(0.1),
    ],
    [],
    0.2,
    38005.9,
  );
}
