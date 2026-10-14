import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedExitRuleTier } from "./batched-exit-rule-tier.js";

/** One step of the batched exit rule tier calculation. */
export interface BatchedExitRuleTierModifier {
  describe(): string;
  adjust(item: BatchedExitRuleTier, value: number): number;
}

export class TieredBatchedExitRuleTierAdjuster implements BatchedExitRuleTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedExitRuleTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameBatchedExitRuleTierAdjuster implements BatchedExitRuleTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BatchedExitRuleTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedExitRuleTierAdjuster implements BatchedExitRuleTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedExitRuleTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedExitRuleTierAdjuster implements BatchedExitRuleTierModifier {
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

  adjust(item: BatchedExitRuleTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedExitRuleTierQuantityOffsetAdjuster implements BatchedExitRuleTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: BatchedExitRuleTier, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingBatchedExitRuleTierAdjuster implements BatchedExitRuleTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedExitRuleTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched exit rule tier steps in order and keeps a trace of each. */
export class BatchedExitRuleTierEngine {
  steps: BatchedExitRuleTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedExitRuleTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedExitRuleTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedExitRuleTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedExitRuleTierEngine(flagsValue: flags.Registry): BatchedExitRuleTierEngine {
  return new BatchedExitRuleTierEngine(
    [
      new TieredBatchedExitRuleTierAdjuster([2029, 2108, 4186, 4948], [1.05, 1.03, 1.2, 1.15]),
      new NameBatchedExitRuleTierAdjuster(new Map<string, number>([["south", 1.12], ["east", 0.8]])),
      new PercentBatchedExitRuleTierAdjuster(16.1),
      new FlaggedBatchedExitRuleTierAdjuster(flagsValue, "batched-exit-rule-tier-weighted", -4.9),
      new BatchedExitRuleTierQuantityOffsetAdjuster(1.16),
      new RoundingBatchedExitRuleTierAdjuster(5),
    ],
    [],
    3.7,
    73830.7,
  );
}
