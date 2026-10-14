import * as flags from "../../../../kit/flags.js";
import { RegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

/** One step of the regional reward rule ledger calculation. */
export interface RegionalRewardRuleLedgerStep {
  describe(): string;
  adjust(item: RegionalRewardRuleLedger, value: number): number;
}

export class MinimumRegionalRewardRuleLedgerAdjuster implements RegionalRewardRuleLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalRewardRuleLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalRewardRuleLedgerRatioOffsetAdjuster implements RegionalRewardRuleLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: RegionalRewardRuleLedger, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentRegionalRewardRuleLedgerAdjuster implements RegionalRewardRuleLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalRewardRuleLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalRewardRuleLedgerAdjuster implements RegionalRewardRuleLedgerStep {
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

  adjust(item: RegionalRewardRuleLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional reward rule ledger steps in order and keeps a trace of each. */
export class RegionalRewardRuleLedgerEngine {
  steps: RegionalRewardRuleLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalRewardRuleLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalRewardRuleLedger): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalRewardRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalRewardRuleLedgerEngine(flagsValue: flags.Registry): RegionalRewardRuleLedgerEngine {
  return new RegionalRewardRuleLedgerEngine(
    [
      new MinimumRegionalRewardRuleLedgerAdjuster(49.1),
      new RegionalRewardRuleLedgerRatioOffsetAdjuster(0.16),
      new PercentRegionalRewardRuleLedgerAdjuster(3.8),
      new FlaggedRegionalRewardRuleLedgerAdjuster(flagsValue, "regional-reward-rule-ledger-global", -2.5),
    ],
    [],
    3,
    42130.2,
  );
}
