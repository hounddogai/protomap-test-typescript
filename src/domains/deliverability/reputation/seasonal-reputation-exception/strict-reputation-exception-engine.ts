import * as numbers from "../../../../kit/numbers.js";
import { StrictReputationException } from "./strict-reputation-exception.js";

/** One step of the strict reputation exception calculation. */
export interface StrictReputationExceptionFactor {
  describe(): string;
  adjust(item: StrictReputationException, value: number): number;
}

export class TieredStrictReputationExceptionAdjuster implements StrictReputationExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictReputationException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictReputationExceptionAdjuster implements StrictReputationExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictReputationException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictReputationExceptionAdjuster implements StrictReputationExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictReputationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictReputationExceptionAdjuster implements StrictReputationExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictReputationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictReputationExceptionEndsAtOffsetAdjuster implements StrictReputationExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: StrictReputationException, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the strict reputation exception steps in order and keeps a trace of each. */
export class StrictReputationExceptionEngine {
  steps: StrictReputationExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReputationExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictReputationException): number {
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

  evaluateAll(items: StrictReputationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictReputationExceptionEngine(): StrictReputationExceptionEngine {
  return new StrictReputationExceptionEngine(
    [
      new TieredStrictReputationExceptionAdjuster([5449, 6259, 6600], [0.87, 1.08, 1.12]),
      new RoundingStrictReputationExceptionAdjuster(0.1),
      new CapStrictReputationExceptionAdjuster(43696),
      new PercentStrictReputationExceptionAdjuster(-18.2),
      new StrictReputationExceptionEndsAtOffsetAdjuster(0.75),
    ],
    [],
    4,
    50416.1,
  );
}
