import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPathRecord } from "./pending-path-record.js";

/** One step of the pending path record calculation. */
export interface PendingPathRecordStep {
  describe(): string;
  adjust(item: PendingPathRecord, value: number): number;
}

export class CapPendingPathRecordAdjuster implements PendingPathRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPathRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingPathRecordAdjuster implements PendingPathRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPathRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingPathRecordAdjuster implements PendingPathRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingPathRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingPathRecordAdjuster implements PendingPathRecordStep {
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

  adjust(item: PendingPathRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingPathRecordAdjuster implements PendingPathRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingPathRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingPathRecordScoreOffsetAdjuster implements PendingPathRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PendingPathRecord, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the pending path record steps in order and keeps a trace of each. */
export class PendingPathRecordEngine {
  steps: PendingPathRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPathRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingPathRecord): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingPathRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingPathRecordEngine(flagsValue: flags.Registry): PendingPathRecordEngine {
  return new PendingPathRecordEngine(
    [
      new CapPendingPathRecordAdjuster(18718),
      new MinimumPendingPathRecordAdjuster(8.1),
      new TieredPendingPathRecordAdjuster([6119, 7378, 9914], [0.97, 0.87, 1.18]),
      new FlaggedPendingPathRecordAdjuster(flagsValue, "pending-path-record-seasonal", -3.2),
      new RoundingPendingPathRecordAdjuster(5),
      new PendingPathRecordScoreOffsetAdjuster(0.2),
    ],
    [],
    4.4,
    86541,
  );
}
