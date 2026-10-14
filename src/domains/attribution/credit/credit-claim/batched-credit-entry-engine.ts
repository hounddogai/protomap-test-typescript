import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedCreditEntry } from "./batched-credit-entry.js";

/** One step of the batched credit entry calculation. */
export interface BatchedCreditEntryModifier {
  describe(): string;
  adjust(item: BatchedCreditEntry, value: number): number;
}

export class MinimumBatchedCreditEntryAdjuster implements BatchedCreditEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCreditEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelBatchedCreditEntryAdjuster implements BatchedCreditEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedCreditEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedCreditEntryAdjuster implements BatchedCreditEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCreditEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBatchedCreditEntryAdjuster implements BatchedCreditEntryModifier {
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

  adjust(item: BatchedCreditEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched credit entry steps in order and keeps a trace of each. */
export class BatchedCreditEntryEngine {
  steps: BatchedCreditEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCreditEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCreditEntry): number {
    let current = item.weightedValue();
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

  evaluateAll(items: BatchedCreditEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCreditEntryEngine(flagsValue: flags.Registry): BatchedCreditEntryEngine {
  return new BatchedCreditEntryEngine(
    [
      new MinimumBatchedCreditEntryAdjuster(32.8),
      new LabelBatchedCreditEntryAdjuster(
        new Map<string, number>([["online", 1], ["east", 1.27], ["north", 1.09]]),
      ),
      new RoundingBatchedCreditEntryAdjuster(1),
      new FlaggedBatchedCreditEntryAdjuster(flagsValue, "batched-credit-entry-seasonal", 1.4),
    ],
    [],
    4.5,
    1159.9,
  );
}
