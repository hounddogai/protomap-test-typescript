import * as flags from "../../../../kit/flags.js";
import { NudgeRollup } from "./nudge-rollup.js";

/** One step of the nudge rollup calculation. */
export interface NudgeRollupFactor {
  describe(): string;
  adjust(item: NudgeRollup, value: number): number;
}

export class PercentNudgeRollupAdjuster implements NudgeRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredNudgeRollupAdjuster implements NudgeRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NudgeRollupImpressionsOffsetAdjuster implements NudgeRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: NudgeRollup, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapNudgeRollupAdjuster implements NudgeRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedNudgeRollupAdjuster implements NudgeRollupFactor {
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

  adjust(item: NudgeRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge rollup steps in order and keeps a trace of each. */
export class NudgeRollupEngine {
  steps: NudgeRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeRollup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: NudgeRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeRollupEngine(flagsValue: flags.Registry): NudgeRollupEngine {
  return new NudgeRollupEngine(
    [
      new PercentNudgeRollupAdjuster(12.7),
      new TieredNudgeRollupAdjuster([982, 1651, 2905, 3200], [1.16, 1.12, 0.95, 1]),
      new NudgeRollupImpressionsOffsetAdjuster(0.09),
      new CapNudgeRollupAdjuster(23912),
      new FlaggedNudgeRollupAdjuster(flagsValue, "nudge-rollup-strict", 7.2),
    ],
    [],
    3.1,
    71148.2,
  );
}
