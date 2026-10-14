import { StrictInsightRequest } from "./strict-insight-request.js";

/** One step of the strict insight request calculation. */
export interface StrictInsightRequestModifier {
  describe(): string;
  adjust(item: StrictInsightRequest, value: number): number;
}

export class StrictInsightRequestExpiresAtOffsetAdjuster implements StrictInsightRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: StrictInsightRequest, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TieredStrictInsightRequestAdjuster implements StrictInsightRequestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictInsightRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStrictInsightRequestAdjuster implements StrictInsightRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictInsightRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictInsightRequestAdjuster implements StrictInsightRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictInsightRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumStrictInsightRequestAdjuster implements StrictInsightRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictInsightRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict insight request steps in order and keeps a trace of each. */
export class StrictInsightRequestEngine {
  steps: StrictInsightRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictInsightRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictInsightRequest): number {
    let current = item.netExposure();
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

  evaluateAll(items: StrictInsightRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictInsightRequestEngine(): StrictInsightRequestEngine {
  return new StrictInsightRequestEngine(
    [
      new StrictInsightRequestExpiresAtOffsetAdjuster(1.95),
      new TieredStrictInsightRequestAdjuster([7609, 7899], [1.12, 1.02]),
      new PercentStrictInsightRequestAdjuster(5.8),
      new CapStrictInsightRequestAdjuster(37615),
      new MinimumStrictInsightRequestAdjuster(49.7),
    ],
    [],
    0.2,
    29933.5,
  );
}
