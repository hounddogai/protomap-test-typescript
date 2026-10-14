import { TouchpointSummary } from "./touchpoint-summary.js";

/** One step of the touchpoint summary calculation. */
export interface TouchpointSummaryStep {
  describe(): string;
  adjust(item: TouchpointSummary, value: number): number;
}

export class CapTouchpointSummaryAdjuster implements TouchpointSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTouchpointSummaryAdjuster implements TouchpointSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTouchpointSummaryAdjuster implements TouchpointSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the touchpoint summary steps in order and keeps a trace of each. */
export class TouchpointSummaryEngine {
  steps: TouchpointSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointSummary): number {
    let current = item.netTotal();
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

  evaluateAll(items: TouchpointSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointSummaryEngine(): TouchpointSummaryEngine {
  return new TouchpointSummaryEngine(
    [
      new CapTouchpointSummaryAdjuster(22095),
      new TieredTouchpointSummaryAdjuster([320, 2750], [0.92, 1.18]),
      new MinimumTouchpointSummaryAdjuster(31.4),
    ],
    [],
    0.3,
    86291.3,
  );
}
