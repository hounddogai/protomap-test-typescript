import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleBatch } from "./exit-rule-batch.js";

/** One step of the exit rule batch calculation. */
export interface ExitRuleBatchAdjuster {
  describe(): string;
  adjust(item: ExitRuleBatch, value: number): number;
}

export class PercentExitRuleBatchAdjuster implements ExitRuleBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentExitRuleBatchAdjuster implements ExitRuleBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ExitRuleBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredExitRuleBatchAdjuster implements ExitRuleBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedExitRuleBatchAdjuster implements ExitRuleBatchAdjuster {
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

  adjust(item: ExitRuleBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule batch steps in order and keeps a trace of each. */
export class ExitRuleBatchEngine {
  steps: ExitRuleBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ExitRuleBatch): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ExitRuleBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultExitRuleBatchEngine(flagsValue: flags.Registry): ExitRuleBatchEngine {
  return new ExitRuleBatchEngine(
    [
      new PercentExitRuleBatchAdjuster(22.4),
      new SegmentExitRuleBatchAdjuster(new Map<string, number>([["east", 1.31]])),
      new TieredExitRuleBatchAdjuster([120, 7455], [1.16, 0.98]),
      new FlaggedExitRuleBatchAdjuster(flagsValue, "exit-rule-batch-rolling", 6.9),
    ],
    [],
    1.2,
    55218.2,
  );
}
