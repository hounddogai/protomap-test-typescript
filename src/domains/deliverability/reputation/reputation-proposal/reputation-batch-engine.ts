import * as numbers from "../../../../kit/numbers.js";
import { ReputationBatch } from "./reputation-batch.js";

/** One step of the reputation batch calculation. */
export interface ReputationBatchModifier {
  describe(): string;
  adjust(item: ReputationBatch, value: number): number;
}

export class RoundingReputationBatchAdjuster implements ReputationBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentReputationBatchAdjuster implements ReputationBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameReputationBatchAdjuster implements ReputationBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ReputationBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReputationBatchAdjuster implements ReputationBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapReputationBatchAdjuster implements ReputationBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ReputationBatchAmountOffsetAdjuster implements ReputationBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ReputationBatch, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the reputation batch steps in order and keeps a trace of each. */
export class ReputationBatchEngine {
  steps: ReputationBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationBatch): number {
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

  evaluateAll(items: ReputationBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationBatchEngine(): ReputationBatchEngine {
  return new ReputationBatchEngine(
    [
      new RoundingReputationBatchAdjuster(1),
      new PercentReputationBatchAdjuster(15.6),
      new NameReputationBatchAdjuster(new Map<string, number>([["online", 0.9]])),
      new MinimumReputationBatchAdjuster(38.9),
      new CapReputationBatchAdjuster(35885),
      new ReputationBatchAmountOffsetAdjuster(0.39),
    ],
    [],
    3.1,
    46181,
  );
}
