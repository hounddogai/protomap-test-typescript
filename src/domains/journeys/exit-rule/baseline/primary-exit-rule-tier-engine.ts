import * as flags from "../../../../kit/flags.js";
import { PrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

/** One step of the primary exit rule tier calculation. */
export interface PrimaryExitRuleTierAdjuster {
  describe(): string;
  adjust(item: PrimaryExitRuleTier, value: number): number;
}

export class FlaggedPrimaryExitRuleTierAdjuster implements PrimaryExitRuleTierAdjuster {
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

  adjust(item: PrimaryExitRuleTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryExitRuleTierMarginOffsetAdjuster implements PrimaryExitRuleTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PrimaryExitRuleTier, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class TieredPrimaryExitRuleTierAdjuster implements PrimaryExitRuleTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryExitRuleTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary exit rule tier steps in order and keeps a trace of each. */
export class PrimaryExitRuleTierEngine {
  steps: PrimaryExitRuleTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryExitRuleTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryExitRuleTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimaryExitRuleTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryExitRuleTierEngine(flagsValue: flags.Registry): PrimaryExitRuleTierEngine {
  return new PrimaryExitRuleTierEngine(
    [
      new FlaggedPrimaryExitRuleTierAdjuster(flagsValue, "primary-exit-rule-tier-seasonal", -1.1),
      new PrimaryExitRuleTierMarginOffsetAdjuster(0.31),
      new TieredPrimaryExitRuleTierAdjuster([278, 2508, 3150, 7831], [0.9, 1.02, 1.16, 0.93]),
    ],
    [],
    5,
    25940.8,
  );
}
