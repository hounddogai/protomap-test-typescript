import * as numbers from "../../../../kit/numbers.js";
import { FallbackPathBatch } from "./fallback-path-batch.js";

/** One step of the fallback path batch calculation. */
export interface FallbackPathBatchModifier {
  describe(): string;
  adjust(item: FallbackPathBatch, value: number): number;
}

export class FallbackPathBatchImpressionsOffsetAdjuster implements FallbackPathBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: FallbackPathBatch, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class PercentFallbackPathBatchAdjuster implements FallbackPathBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPathBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackPathBatchAdjuster implements FallbackPathBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPathBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback path batch steps in order and keeps a trace of each. */
export class FallbackPathBatchEngine {
  steps: FallbackPathBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPathBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPathBatch): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FallbackPathBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPathBatchEngine(): FallbackPathBatchEngine {
  return new FallbackPathBatchEngine(
    [
      new FallbackPathBatchImpressionsOffsetAdjuster(0.41),
      new PercentFallbackPathBatchAdjuster(21.5),
      new CapFallbackPathBatchAdjuster(31962),
    ],
    [],
    2.2,
    33227.8,
  );
}
