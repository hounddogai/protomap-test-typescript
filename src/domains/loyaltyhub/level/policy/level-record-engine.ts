import * as numbers from "../../../../kit/numbers.js";
import { LevelRecord } from "./level-record.js";

/** One step of the level record calculation. */
export interface LevelRecordFactor {
  describe(): string;
  adjust(item: LevelRecord, value: number): number;
}

export class CapLevelRecordAdjuster implements LevelRecordFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLevelRecordAdjuster implements LevelRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLevelRecordAdjuster implements LevelRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LevelRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLevelRecordAdjuster implements LevelRecordFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLevelRecordAdjuster implements LevelRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLevelRecordAdjuster implements LevelRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level record steps in order and keeps a trace of each. */
export class LevelRecordEngine {
  steps: LevelRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelRecord): number {
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

  evaluateAll(items: LevelRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelRecordEngine(): LevelRecordEngine {
  return new LevelRecordEngine(
    [
      new CapLevelRecordAdjuster(20222),
      new MinimumLevelRecordAdjuster(23.1),
      new LabelLevelRecordAdjuster(new Map<string, number>([["online", 0.91], ["south", 1.19]])),
      new TieredLevelRecordAdjuster([303, 3206, 8254], [0.95, 0.92, 0.94]),
      new RoundingLevelRecordAdjuster(0.1),
      new PercentLevelRecordAdjuster(-18.4),
    ],
    [],
    3.1,
    11876.9,
  );
}
