import * as numbers from "../../../../kit/numbers.js";
import { DefaultProofBatch } from "./default-proof-batch.js";

/** One step of the default proof batch calculation. */
export interface DefaultProofBatchStep {
  describe(): string;
  adjust(item: DefaultProofBatch, value: number): number;
}

export class RoundingDefaultProofBatchAdjuster implements DefaultProofBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultProofBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DefaultProofBatchGraceDaysOffsetAdjuster implements DefaultProofBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: DefaultProofBatch, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentDefaultProofBatchAdjuster implements DefaultProofBatchStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultProofBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default proof batch steps in order and keeps a trace of each. */
export class DefaultProofBatchEngine {
  steps: DefaultProofBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultProofBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultProofBatch): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultProofBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultProofBatchEngine(): DefaultProofBatchEngine {
  return new DefaultProofBatchEngine(
    [
      new RoundingDefaultProofBatchAdjuster(0.1),
      new DefaultProofBatchGraceDaysOffsetAdjuster(0.56),
      new PercentDefaultProofBatchAdjuster(21.8),
    ],
    [],
    0,
    55551.7,
  );
}
