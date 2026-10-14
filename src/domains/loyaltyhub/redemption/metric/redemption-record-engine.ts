import * as numbers from "../../../../kit/numbers.js";
import { RedemptionRecord } from "./redemption-record.js";

/** One step of the redemption record calculation. */
export interface RedemptionRecordAdjuster {
  describe(): string;
  adjust(item: RedemptionRecord, value: number): number;
}

export class MinimumRedemptionRecordAdjuster implements RedemptionRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelRedemptionRecordAdjuster implements RedemptionRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RedemptionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRedemptionRecordAdjuster implements RedemptionRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RedemptionRecordSequenceOffsetAdjuster implements RedemptionRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RedemptionRecord, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class RoundingRedemptionRecordAdjuster implements RedemptionRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRedemptionRecordAdjuster implements RedemptionRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption record steps in order and keeps a trace of each. */
export class RedemptionRecordEngine {
  steps: RedemptionRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionRecord): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RedemptionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionRecordEngine(): RedemptionRecordEngine {
  return new RedemptionRecordEngine(
    [
      new MinimumRedemptionRecordAdjuster(27.9),
      new LabelRedemptionRecordAdjuster(new Map<string, number>([["south", 0.84], ["retail", 0.98]])),
      new CapRedemptionRecordAdjuster(38740),
      new RedemptionRecordSequenceOffsetAdjuster(1.5),
      new RoundingRedemptionRecordAdjuster(0.25),
      new PercentRedemptionRecordAdjuster(-16.6),
    ],
    [],
    1.5,
    14721.8,
  );
}
