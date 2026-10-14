import * as flags from "../../../../kit/flags.js";
import { PendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

/** One step of the pending double opt in rollup calculation. */
export interface PendingDoubleOptInRollupStep {
  describe(): string;
  adjust(item: PendingDoubleOptInRollup, value: number): number;
}

export class TieredPendingDoubleOptInRollupAdjuster implements PendingDoubleOptInRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingDoubleOptInRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPendingDoubleOptInRollupAdjuster implements PendingDoubleOptInRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingDoubleOptInRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingDoubleOptInRollupAdjuster implements PendingDoubleOptInRollupStep {
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

  adjust(item: PendingDoubleOptInRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending double opt in rollup steps in order and keeps a trace of each. */
export class PendingDoubleOptInRollupEngine {
  steps: PendingDoubleOptInRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDoubleOptInRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingDoubleOptInRollup): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PendingDoubleOptInRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingDoubleOptInRollupEngine(flagsValue: flags.Registry): PendingDoubleOptInRollupEngine {
  return new PendingDoubleOptInRollupEngine(
    [
      new TieredPendingDoubleOptInRollupAdjuster([1596, 2711, 2983], [0.95, 0.81, 0.88]),
      new ChannelPendingDoubleOptInRollupAdjuster(new Map<string, number>([["west", 0.77]])),
      new FlaggedPendingDoubleOptInRollupAdjuster(flagsValue, "pending-double-opt-in-rollup-batched", -6.5),
    ],
    [],
    3.9,
    33909.9,
  );
}
