import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

/** One step of the batched exit rule mapping calculation. */
export interface BatchedExitRuleMappingAdjuster {
  describe(): string;
  adjust(item: BatchedExitRuleMapping, value: number): number;
}

export class BatchedExitRuleMappingOpenRateOffsetAdjuster implements BatchedExitRuleMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: BatchedExitRuleMapping, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedBatchedExitRuleMappingAdjuster implements BatchedExitRuleMappingAdjuster {
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

  adjust(item: BatchedExitRuleMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedExitRuleMappingAdjuster implements BatchedExitRuleMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedExitRuleMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedExitRuleMappingAdjuster implements BatchedExitRuleMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedExitRuleMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleBatchedExitRuleMappingAdjuster implements BatchedExitRuleMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedExitRuleMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched exit rule mapping steps in order and keeps a trace of each. */
export class BatchedExitRuleMappingEngine {
  steps: BatchedExitRuleMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedExitRuleMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedExitRuleMapping): number {
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

  evaluateAll(items: BatchedExitRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedExitRuleMappingEngine(flagsValue: flags.Registry): BatchedExitRuleMappingEngine {
  return new BatchedExitRuleMappingEngine(
    [
      new BatchedExitRuleMappingOpenRateOffsetAdjuster(0.43),
      new FlaggedBatchedExitRuleMappingAdjuster(flagsValue, "batched-exit-rule-mapping-rolling", 3.5),
      new CapBatchedExitRuleMappingAdjuster(19079),
      new PercentBatchedExitRuleMappingAdjuster(24.8),
      new LocaleBatchedExitRuleMappingAdjuster(new Map<string, number>([["central", 0.82]])),
    ],
    [],
    0.5,
    95667.6,
  );
}
