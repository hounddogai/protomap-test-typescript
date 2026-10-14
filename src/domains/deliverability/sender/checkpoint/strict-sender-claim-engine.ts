import * as numbers from "../../../../kit/numbers.js";
import { StrictSenderClaim } from "./strict-sender-claim.js";

/** One step of the strict sender claim calculation. */
export interface StrictSenderClaimFactor {
  describe(): string;
  adjust(item: StrictSenderClaim, value: number): number;
}

export class PercentStrictSenderClaimAdjuster implements StrictSenderClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictSenderClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictSenderClaimAdjuster implements StrictSenderClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictSenderClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictSenderClaimAdjuster implements StrictSenderClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictSenderClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictSenderClaimAdjuster implements StrictSenderClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictSenderClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict sender claim steps in order and keeps a trace of each. */
export class StrictSenderClaimEngine {
  steps: StrictSenderClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictSenderClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictSenderClaim): number {
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

  evaluateAll(items: StrictSenderClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictSenderClaimEngine(): StrictSenderClaimEngine {
  return new StrictSenderClaimEngine(
    [
      new PercentStrictSenderClaimAdjuster(-13.3),
      new CapStrictSenderClaimAdjuster(670),
      new TieredStrictSenderClaimAdjuster([1086, 1186, 6234], [0.83, 0.92, 0.92]),
      new RoundingStrictSenderClaimAdjuster(1),
    ],
    [],
    1.4,
    9716.6,
  );
}
