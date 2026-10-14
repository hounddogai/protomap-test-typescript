import * as numbers from "../../../../kit/numbers.js";
import { GlobalCreativeSummary } from "./global-creative-summary.js";

/** One step of the global creative summary calculation. */
export interface GlobalCreativeSummaryStep {
  describe(): string;
  adjust(item: GlobalCreativeSummary, value: number): number;
}

export class MinimumGlobalCreativeSummaryAdjuster implements GlobalCreativeSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCreativeSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalCreativeSummaryAdjuster implements GlobalCreativeSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalCreativeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalCreativeSummaryAdjuster implements GlobalCreativeSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCreativeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global creative summary steps in order and keeps a trace of each. */
export class GlobalCreativeSummaryEngine {
  steps: GlobalCreativeSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCreativeSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalCreativeSummary): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: GlobalCreativeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalCreativeSummaryEngine(): GlobalCreativeSummaryEngine {
  return new GlobalCreativeSummaryEngine(
    [
      new MinimumGlobalCreativeSummaryAdjuster(28.6),
      new RoundingGlobalCreativeSummaryAdjuster(1),
      new CapGlobalCreativeSummaryAdjuster(9758),
    ],
    [],
    2.8,
    80230.9,
  );
}
