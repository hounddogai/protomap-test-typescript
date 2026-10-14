import * as numbers from "../../../../kit/numbers.js";
import { MentionBatch } from "./mention-batch.js";

/** One step of the mention batch calculation. */
export interface MentionBatchFactor {
  describe(): string;
  adjust(item: MentionBatch, value: number): number;
}

export class RoundingMentionBatchAdjuster implements MentionBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumMentionBatchAdjuster implements MentionBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class MentionBatchMaximumOffsetAdjuster implements MentionBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: MentionBatch, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class NameMentionBatchAdjuster implements MentionBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: MentionBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentMentionBatchAdjuster implements MentionBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredMentionBatchAdjuster implements MentionBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the mention batch steps in order and keeps a trace of each. */
export class MentionBatchEngine {
  steps: MentionBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionBatch): number {
    let current = item.netValue();
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

  evaluateAll(items: MentionBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionBatchEngine(): MentionBatchEngine {
  return new MentionBatchEngine(
    [
      new RoundingMentionBatchAdjuster(1),
      new MinimumMentionBatchAdjuster(25),
      new MentionBatchMaximumOffsetAdjuster(0.83),
      new NameMentionBatchAdjuster(new Map<string, number>([["online", 1.04]])),
      new PercentMentionBatchAdjuster(-6.7),
      new TieredMentionBatchAdjuster([642, 4020, 4726, 8346], [1.11, 1, 0.87, 0.9]),
    ],
    [],
    0.1,
    44008.6,
  );
}
