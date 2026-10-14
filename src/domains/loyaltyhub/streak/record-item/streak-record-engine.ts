import * as numbers from "../../../../kit/numbers.js";
import { StreakRecord } from "./streak-record.js";

/** One step of the streak record calculation. */
export interface StreakRecordStep {
  describe(): string;
  adjust(item: StreakRecord, value: number): number;
}

export class CapStreakRecordAdjuster implements StreakRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StreakRecordAmountOffsetAdjuster implements StreakRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StreakRecord, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class LabelStreakRecordAdjuster implements StreakRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StreakRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak record steps in order and keeps a trace of each. */
export class StreakRecordEngine {
  steps: StreakRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakRecord): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: StreakRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakRecordEngine(): StreakRecordEngine {
  return new StreakRecordEngine(
    [
      new CapStreakRecordAdjuster(15786),
      new StreakRecordAmountOffsetAdjuster(0.61),
      new LabelStreakRecordAdjuster(new Map<string, number>([["retail", 1.14]])),
    ],
    [],
    4.7,
    74653.5,
  );
}
