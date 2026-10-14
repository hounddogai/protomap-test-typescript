import * as numbers from "../../../../kit/numbers.js";
import { StrictCohortProfile } from "./strict-cohort-profile.js";

/** One step of the strict cohort profile calculation. */
export interface StrictCohortProfileAdjuster {
  describe(): string;
  adjust(item: StrictCohortProfile, value: number): number;
}

export class TieredStrictCohortProfileAdjuster implements StrictCohortProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictCohortProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictCohortProfileAdjuster implements StrictCohortProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCohortProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelStrictCohortProfileAdjuster implements StrictCohortProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictCohortProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStrictCohortProfileAdjuster implements StrictCohortProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictCohortProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict cohort profile steps in order and keeps a trace of each. */
export class StrictCohortProfileEngine {
  steps: StrictCohortProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCohortProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCohortProfile): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: StrictCohortProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCohortProfileEngine(): StrictCohortProfileEngine {
  return new StrictCohortProfileEngine(
    [
      new TieredStrictCohortProfileAdjuster([3215, 5114, 7712, 9030], [1.07, 1.08, 0.99, 0.82]),
      new CapStrictCohortProfileAdjuster(3146),
      new ChannelStrictCohortProfileAdjuster(
        new Map<string, number>([["central", 1.24], ["retail", 1.02], ["online", 0.91]]),
      ),
      new RoundingStrictCohortProfileAdjuster(0.1),
    ],
    [],
    3.2,
    2534,
  );
}
