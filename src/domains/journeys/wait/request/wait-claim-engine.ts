import * as numbers from "../../../../kit/numbers.js";
import { WaitClaim } from "./wait-claim.js";

/** One step of the wait claim calculation. */
export interface WaitClaimFactor {
  describe(): string;
  adjust(item: WaitClaim, value: number): number;
}

export class PercentWaitClaimAdjuster implements WaitClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelWaitClaimAdjuster implements WaitClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WaitClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitClaimAdjuster implements WaitClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWaitClaimAdjuster implements WaitClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWaitClaimAdjuster implements WaitClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the wait claim steps in order and keeps a trace of each. */
export class WaitClaimEngine {
  steps: WaitClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitClaim): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WaitClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitClaimEngine(): WaitClaimEngine {
  return new WaitClaimEngine(
    [
      new PercentWaitClaimAdjuster(12.8),
      new LabelWaitClaimAdjuster(new Map<string, number>([["west", 0.87], ["central", 1.23], ["north", 1.32]])),
      new TieredWaitClaimAdjuster([1918, 4058], [0.83, 1.08]),
      new CapWaitClaimAdjuster(28851),
      new MinimumWaitClaimAdjuster(18.5),
    ],
    [],
    4.7,
    1973.6,
  );
}
