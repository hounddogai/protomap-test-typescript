import * as numbers from "../../../../kit/numbers.js";
import { TieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

/** One step of the tiered exit rule entry calculation. */
export interface TieredExitRuleEntryAdjuster {
  describe(): string;
  adjust(item: TieredExitRuleEntry, value: number): number;
}

export class RoundingTieredExitRuleEntryAdjuster implements TieredExitRuleEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredExitRuleEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredExitRuleEntryAdjuster implements TieredExitRuleEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredExitRuleEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredExitRuleEntryAdjuster implements TieredExitRuleEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredExitRuleEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredExitRuleEntryAdjuster implements TieredExitRuleEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredExitRuleEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitTieredExitRuleEntryAdjuster implements TieredExitRuleEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredExitRuleEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered exit rule entry steps in order and keeps a trace of each. */
export class TieredExitRuleEntryEngine {
  steps: TieredExitRuleEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredExitRuleEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredExitRuleEntry): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredExitRuleEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredExitRuleEntryEngine(): TieredExitRuleEntryEngine {
  return new TieredExitRuleEntryEngine(
    [
      new RoundingTieredExitRuleEntryAdjuster(0.1),
      new CapTieredExitRuleEntryAdjuster(39335),
      new PercentTieredExitRuleEntryAdjuster(-1.3),
      new MinimumTieredExitRuleEntryAdjuster(5.7),
      new UnitTieredExitRuleEntryAdjuster(new Map<string, number>([["central", 1.32], ["south", 0.96]])),
    ],
    [],
    0.4,
    91395.7,
  );
}
