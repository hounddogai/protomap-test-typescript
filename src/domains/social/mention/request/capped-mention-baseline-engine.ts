import * as numbers from "../../../../kit/numbers.js";
import { CappedMentionBaseline } from "./capped-mention-baseline.js";

/** One step of the capped mention baseline calculation. */
export interface CappedMentionBaselineFactor {
  describe(): string;
  adjust(item: CappedMentionBaseline, value: number): number;
}

export class CapCappedMentionBaselineAdjuster implements CappedMentionBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedMentionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedMentionBaselineAdjuster implements CappedMentionBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedMentionBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedMentionBaselineAdjuster implements CappedMentionBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedMentionBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped mention baseline steps in order and keeps a trace of each. */
export class CappedMentionBaselineEngine {
  steps: CappedMentionBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedMentionBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedMentionBaseline): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CappedMentionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedMentionBaselineEngine(): CappedMentionBaselineEngine {
  return new CappedMentionBaselineEngine(
    [
      new CapCappedMentionBaselineAdjuster(20853),
      new MinimumCappedMentionBaselineAdjuster(27.6),
      new PercentCappedMentionBaselineAdjuster(19.9),
    ],
    [],
    0.8,
    71428.6,
  );
}
