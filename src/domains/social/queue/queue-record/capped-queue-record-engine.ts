import * as numbers from "../../../../kit/numbers.js";
import { CappedQueueRecord } from "./capped-queue-record.js";

/** One step of the capped queue record calculation. */
export interface CappedQueueRecordStep {
  describe(): string;
  adjust(item: CappedQueueRecord, value: number): number;
}

export class CappedQueueRecordVersionOffsetAdjuster implements CappedQueueRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: CappedQueueRecord, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingCappedQueueRecordAdjuster implements CappedQueueRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedQueueRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedQueueRecordAdjuster implements CappedQueueRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedQueueRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedQueueRecordAdjuster implements CappedQueueRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedQueueRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedQueueRecordAdjuster implements CappedQueueRecordStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedQueueRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceCappedQueueRecordAdjuster implements CappedQueueRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: CappedQueueRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped queue record steps in order and keeps a trace of each. */
export class CappedQueueRecordEngine {
  steps: CappedQueueRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedQueueRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedQueueRecord): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: CappedQueueRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedQueueRecordEngine(): CappedQueueRecordEngine {
  return new CappedQueueRecordEngine(
    [
      new CappedQueueRecordVersionOffsetAdjuster(0.28),
      new RoundingCappedQueueRecordAdjuster(0.25),
      new MinimumCappedQueueRecordAdjuster(20),
      new PercentCappedQueueRecordAdjuster(-12.5),
      new CapCappedQueueRecordAdjuster(24853),
      new SourceCappedQueueRecordAdjuster(
        new Map<string, number>([["east", 1.04], ["retail", 1.35], ["online", 0.96]]),
      ),
    ],
    [],
    3.4,
    8043.2,
  );
}
