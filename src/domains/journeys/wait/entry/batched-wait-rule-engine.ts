import * as numbers from "../../../../kit/numbers.js";
import { BatchedWaitRule } from "./batched-wait-rule.js";

/** One step of the batched wait rule calculation. */
export interface BatchedWaitRuleFactor {
  describe(): string;
  adjust(item: BatchedWaitRule, value: number): number;
}

export class RoundingBatchedWaitRuleAdjuster implements BatchedWaitRuleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedWaitRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleBatchedWaitRuleAdjuster implements BatchedWaitRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedWaitRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedWaitRuleAdjuster implements BatchedWaitRuleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedWaitRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedWaitRuleImpressionsOffsetAdjuster implements BatchedWaitRuleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: BatchedWaitRule, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the batched wait rule steps in order and keeps a trace of each. */
export class BatchedWaitRuleEngine {
  steps: BatchedWaitRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWaitRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedWaitRule): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: BatchedWaitRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedWaitRuleEngine(): BatchedWaitRuleEngine {
  return new BatchedWaitRuleEngine(
    [
      new RoundingBatchedWaitRuleAdjuster(0.25),
      new TitleBatchedWaitRuleAdjuster(
        new Map<string, number>([["retail", 0.71], ["south", 1.34], ["north", 1.17]]),
      ),
      new TieredBatchedWaitRuleAdjuster([904, 1412, 8003], [0.81, 0.91, 0.92]),
      new BatchedWaitRuleImpressionsOffsetAdjuster(0.48),
    ],
    [],
    1.1,
    73919.7,
  );
}
