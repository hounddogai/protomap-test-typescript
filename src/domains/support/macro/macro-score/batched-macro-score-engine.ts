import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedMacroScore } from "./batched-macro-score.js";

/** One step of the batched macro score calculation. */
export interface BatchedMacroScoreStep {
  describe(): string;
  adjust(item: BatchedMacroScore, value: number): number;
}

export class FlaggedBatchedMacroScoreAdjuster implements BatchedMacroScoreStep {
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

  adjust(item: BatchedMacroScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedMacroScoreAdjuster implements BatchedMacroScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedMacroScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedMacroScoreAdjuster implements BatchedMacroScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedMacroScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameBatchedMacroScoreAdjuster implements BatchedMacroScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BatchedMacroScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched macro score steps in order and keeps a trace of each. */
export class BatchedMacroScoreEngine {
  steps: BatchedMacroScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedMacroScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedMacroScore): number {
    let current = item.netTotal();
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

  evaluateAll(items: BatchedMacroScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedMacroScoreEngine(flagsValue: flags.Registry): BatchedMacroScoreEngine {
  return new BatchedMacroScoreEngine(
    [
      new FlaggedBatchedMacroScoreAdjuster(flagsValue, "batched-macro-score-manual", -5.6),
      new TieredBatchedMacroScoreAdjuster([567, 6570, 9782], [0.98, 1.02, 0.83]),
      new PercentBatchedMacroScoreAdjuster(-18),
      new NameBatchedMacroScoreAdjuster(
        new Map<string, number>([["retail", 1.12], ["central", 0.74], ["west", 1]]),
      ),
    ],
    [],
    2.9,
    70338.1,
  );
}
