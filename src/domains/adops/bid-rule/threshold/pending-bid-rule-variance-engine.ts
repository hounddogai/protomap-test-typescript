import * as flags from "../../../../kit/flags.js";
import { PendingBidRuleVariance } from "./pending-bid-rule-variance.js";

/** One step of the pending bid rule variance calculation. */
export interface PendingBidRuleVarianceAdjuster {
  describe(): string;
  adjust(item: PendingBidRuleVariance, value: number): number;
}

export class PendingBidRuleVarianceRatioOffsetAdjuster implements PendingBidRuleVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: PendingBidRuleVariance, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedPendingBidRuleVarianceAdjuster implements PendingBidRuleVarianceAdjuster {
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

  adjust(item: PendingBidRuleVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingBidRuleVarianceAdjuster implements PendingBidRuleVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRuleVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending bid rule variance steps in order and keeps a trace of each. */
export class PendingBidRuleVarianceEngine {
  steps: PendingBidRuleVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingBidRuleVariance): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingBidRuleVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleVarianceEngine(flagsValue: flags.Registry): PendingBidRuleVarianceEngine {
  return new PendingBidRuleVarianceEngine(
    [
      new PendingBidRuleVarianceRatioOffsetAdjuster(1.06),
      new FlaggedPendingBidRuleVarianceAdjuster(flagsValue, "pending-bid-rule-variance-manual", 9.5),
      new MinimumPendingBidRuleVarianceAdjuster(44),
    ],
    [],
    4.4,
    41726.1,
  );
}
