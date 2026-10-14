import * as numbers from "../../../../kit/numbers.js";
import { LenientRetentionRequest } from "./lenient-retention-request.js";

/** One step of the lenient retention request calculation. */
export interface LenientRetentionRequestStep {
  describe(): string;
  adjust(item: LenientRetentionRequest, value: number): number;
}

export class SegmentLenientRetentionRequestAdjuster implements LenientRetentionRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LenientRetentionRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientRetentionRequestAdjuster implements LenientRetentionRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientRetentionRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientRetentionRequestAdjuster implements LenientRetentionRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientRetentionRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientRetentionRequestAdjuster implements LenientRetentionRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRetentionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient retention request steps in order and keeps a trace of each. */
export class LenientRetentionRequestEngine {
  steps: LenientRetentionRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRetentionRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientRetentionRequest): number {
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

  evaluateAll(items: LenientRetentionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientRetentionRequestEngine(): LenientRetentionRequestEngine {
  return new LenientRetentionRequestEngine(
    [
      new SegmentLenientRetentionRequestAdjuster(
        new Map<string, number>([["north", 1.22], ["south", 1.29], ["retail", 1.07]]),
      ),
      new MinimumLenientRetentionRequestAdjuster(36),
      new PercentLenientRetentionRequestAdjuster(-0.7),
      new CapLenientRetentionRequestAdjuster(42601),
    ],
    [],
    4.3,
    89400.3,
  );
}
