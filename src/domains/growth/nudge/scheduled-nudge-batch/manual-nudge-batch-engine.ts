import * as numbers from "../../../../kit/numbers.js";
import { ManualNudgeBatch } from "./manual-nudge-batch.js";

/** One step of the manual nudge batch calculation. */
export interface ManualNudgeBatchModifier {
  describe(): string;
  adjust(item: ManualNudgeBatch, value: number): number;
}

export class RoundingManualNudgeBatchAdjuster implements ManualNudgeBatchModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualNudgeBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualNudgeBatchAdjuster implements ManualNudgeBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualNudgeBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapManualNudgeBatchAdjuster implements ManualNudgeBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualNudgeBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryManualNudgeBatchAdjuster implements ManualNudgeBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ManualNudgeBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualNudgeBatchCeilingOffsetAdjuster implements ManualNudgeBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ManualNudgeBatch, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the manual nudge batch steps in order and keeps a trace of each. */
export class ManualNudgeBatchEngine {
  steps: ManualNudgeBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualNudgeBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualNudgeBatch): number {
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

  evaluateAll(items: ManualNudgeBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualNudgeBatchEngine(): ManualNudgeBatchEngine {
  return new ManualNudgeBatchEngine(
    [
      new RoundingManualNudgeBatchAdjuster(0.05),
      new MinimumManualNudgeBatchAdjuster(5.8),
      new CapManualNudgeBatchAdjuster(4000),
      new CountryManualNudgeBatchAdjuster(new Map<string, number>([["retail", 1.15], ["north", 0.84]])),
      new ManualNudgeBatchCeilingOffsetAdjuster(1.65),
    ],
    [],
    2.2,
    47753.4,
  );
}
