import * as numbers from "../../../../kit/numbers.js";
import { PendingSuppressionRecord } from "./pending-suppression-record.js";

/** One step of the pending suppression record calculation. */
export interface PendingSuppressionRecordFactor {
  describe(): string;
  adjust(item: PendingSuppressionRecord, value: number): number;
}

export class MinimumPendingSuppressionRecordAdjuster implements PendingSuppressionRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryPendingSuppressionRecordAdjuster implements PendingSuppressionRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingSuppressionRecordAdjuster implements PendingSuppressionRecordFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingSuppressionRecordAdjuster implements PendingSuppressionRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingSuppressionRecordStartsAtOffsetAdjuster implements PendingSuppressionRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingPendingSuppressionRecordAdjuster implements PendingSuppressionRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSuppressionRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending suppression record steps in order and keeps a trace of each. */
export class PendingSuppressionRecordEngine {
  steps: PendingSuppressionRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSuppressionRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingSuppressionRecord): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PendingSuppressionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingSuppressionRecordEngine(): PendingSuppressionRecordEngine {
  return new PendingSuppressionRecordEngine(
    [
      new MinimumPendingSuppressionRecordAdjuster(2.7),
      new CategoryPendingSuppressionRecordAdjuster(
        new Map<string, number>([["online", 1.29], ["central", 1.25]]),
      ),
      new CapPendingSuppressionRecordAdjuster(44174),
      new PercentPendingSuppressionRecordAdjuster(11.3),
      new PendingSuppressionRecordStartsAtOffsetAdjuster(0.2),
      new RoundingPendingSuppressionRecordAdjuster(0.1),
    ],
    [],
    1.4,
    91085.8,
  );
}
