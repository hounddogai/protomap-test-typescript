import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRewardRollup } from "./pending-reward-rollup.js";

/** One step of the pending reward rollup calculation. */
export interface PendingRewardRollupModifier {
  describe(): string;
  adjust(item: PendingRewardRollup, value: number): number;
}

export class TieredPendingRewardRollupAdjuster implements PendingRewardRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingRewardRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingRewardRollupAdjuster implements PendingRewardRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingRewardRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingRewardRollupAdjuster implements PendingRewardRollupModifier {
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

  adjust(item: PendingRewardRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingRewardRollupAdjuster implements PendingRewardRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending reward rollup steps in order and keeps a trace of each. */
export class PendingRewardRollupEngine {
  steps: PendingRewardRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingRewardRollup): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PendingRewardRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingRewardRollupEngine(flagsValue: flags.Registry): PendingRewardRollupEngine {
  return new PendingRewardRollupEngine(
    [
      new TieredPendingRewardRollupAdjuster([1457, 3569], [0.9, 0.84]),
      new RoundingPendingRewardRollupAdjuster(1),
      new FlaggedPendingRewardRollupAdjuster(flagsValue, "pending-reward-rollup-manual", -1.9),
      new CapPendingRewardRollupAdjuster(43666),
    ],
    [],
    3.8,
    46664.2,
  );
}
