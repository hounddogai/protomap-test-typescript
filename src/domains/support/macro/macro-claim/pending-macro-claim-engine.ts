import { PendingMacroClaim } from "./pending-macro-claim.js";

/** One step of the pending macro claim calculation. */
export interface PendingMacroClaimFactor {
  describe(): string;
  adjust(item: PendingMacroClaim, value: number): number;
}

export class TieredPendingMacroClaimAdjuster implements PendingMacroClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingMacroClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingMacroClaimAdjuster implements PendingMacroClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingMacroClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelPendingMacroClaimAdjuster implements PendingMacroClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingMacroClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending macro claim steps in order and keeps a trace of each. */
export class PendingMacroClaimEngine {
  steps: PendingMacroClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingMacroClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingMacroClaim): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingMacroClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingMacroClaimEngine(): PendingMacroClaimEngine {
  return new PendingMacroClaimEngine(
    [
      new TieredPendingMacroClaimAdjuster([2319, 4226, 5457, 9512], [0.91, 1.13, 0.88, 1.18]),
      new CapPendingMacroClaimAdjuster(3009),
      new ChannelPendingMacroClaimAdjuster(new Map<string, number>([["west", 0.8]])),
    ],
    [],
    0.3,
    28994.6,
  );
}
