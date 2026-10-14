import * as numbers from "../../../../kit/numbers.js";
import { WarmupRecord } from "./warmup-record.js";

/** One step of the warmup record calculation. */
export interface WarmupRecordModifier {
  describe(): string;
  adjust(item: WarmupRecord, value: number): number;
}

export class CapWarmupRecordAdjuster implements WarmupRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWarmupRecordAdjuster implements WarmupRecordModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWarmupRecordAdjuster implements WarmupRecordModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WarmupRecordScoreOffsetAdjuster implements WarmupRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WarmupRecord, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the warmup record steps in order and keeps a trace of each. */
export class WarmupRecordEngine {
  steps: WarmupRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupRecord): number {
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

  evaluateAll(items: WarmupRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupRecordEngine(): WarmupRecordEngine {
  return new WarmupRecordEngine(
    [
      new CapWarmupRecordAdjuster(23079),
      new TieredWarmupRecordAdjuster([152, 8301], [1.02, 0.89]),
      new PercentWarmupRecordAdjuster(-14),
      new WarmupRecordScoreOffsetAdjuster(1.74),
    ],
    [],
    4.9,
    22173,
  );
}
