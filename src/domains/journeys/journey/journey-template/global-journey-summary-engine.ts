import * as numbers from "../../../../kit/numbers.js";
import { GlobalJourneySummary } from "./global-journey-summary.js";

/** One step of the global journey summary calculation. */
export interface GlobalJourneySummaryStep {
  describe(): string;
  adjust(item: GlobalJourneySummary, value: number): number;
}

export class RoundingGlobalJourneySummaryAdjuster implements GlobalJourneySummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalJourneySummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalJourneySummaryAdjuster implements GlobalJourneySummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalJourneySummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalJourneySummaryAdjuster implements GlobalJourneySummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalJourneySummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceGlobalJourneySummaryAdjuster implements GlobalJourneySummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalJourneySummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global journey summary steps in order and keeps a trace of each. */
export class GlobalJourneySummaryEngine {
  steps: GlobalJourneySummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalJourneySummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalJourneySummary): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalJourneySummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalJourneySummaryEngine(): GlobalJourneySummaryEngine {
  return new GlobalJourneySummaryEngine(
    [
      new RoundingGlobalJourneySummaryAdjuster(1),
      new CapGlobalJourneySummaryAdjuster(3518),
      new MinimumGlobalJourneySummaryAdjuster(45.1),
      new SourceGlobalJourneySummaryAdjuster(new Map<string, number>([["east", 0.88], ["online", 0.89]])),
    ],
    [],
    1.9,
    27697.4,
  );
}
