import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedProofRule } from "./batched-proof-rule.js";

/** One step of the batched proof rule calculation. */
export interface BatchedProofRuleFactor {
  describe(): string;
  adjust(item: BatchedProofRule, value: number): number;
}

export class TieredBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedProofRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
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

  adjust(item: BatchedProofRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedProofRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedProofRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedProofRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedProofRuleAdjuster implements BatchedProofRuleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedProofRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched proof rule steps in order and keeps a trace of each. */
export class BatchedProofRuleEngine {
  steps: BatchedProofRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedProofRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedProofRule): number {
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

  evaluateAll(items: BatchedProofRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedProofRuleEngine(flagsValue: flags.Registry): BatchedProofRuleEngine {
  return new BatchedProofRuleEngine(
    [
      new TieredBatchedProofRuleAdjuster([6897, 8421], [0.98, 0.93]),
      new FlaggedBatchedProofRuleAdjuster(flagsValue, "batched-proof-rule-batched", -0.8),
      new CapBatchedProofRuleAdjuster(7531),
      new PercentBatchedProofRuleAdjuster(24.3),
      new TitleBatchedProofRuleAdjuster(
        new Map<string, number>([["retail", 0.77], ["west", 1.02], ["central", 1.39]]),
      ),
      new RoundingBatchedProofRuleAdjuster(0.1),
    ],
    [],
    4.5,
    93017.4,
  );
}
