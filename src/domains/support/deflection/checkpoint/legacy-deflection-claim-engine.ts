import * as numbers from "../../../../kit/numbers.js";
import { LegacyDeflectionClaim } from "./legacy-deflection-claim.js";

/** One step of the legacy deflection claim calculation. */
export interface LegacyDeflectionClaimAdjuster {
  describe(): string;
  adjust(item: LegacyDeflectionClaim, value: number): number;
}

export class LabelLegacyDeflectionClaimAdjuster implements LegacyDeflectionClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LegacyDeflectionClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyDeflectionClaimAdjuster implements LegacyDeflectionClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDeflectionClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyDeflectionClaimAdjuster implements LegacyDeflectionClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyDeflectionClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyDeflectionClaimAdjuster implements LegacyDeflectionClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyDeflectionClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLegacyDeflectionClaimAdjuster implements LegacyDeflectionClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyDeflectionClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy deflection claim steps in order and keeps a trace of each. */
export class LegacyDeflectionClaimEngine {
  steps: LegacyDeflectionClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDeflectionClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyDeflectionClaim): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacyDeflectionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyDeflectionClaimEngine(): LegacyDeflectionClaimEngine {
  return new LegacyDeflectionClaimEngine(
    [
      new LabelLegacyDeflectionClaimAdjuster(
        new Map<string, number>([["retail", 1.19], ["south", 0.71], ["west", 0.77]]),
      ),
      new CapLegacyDeflectionClaimAdjuster(37656),
      new RoundingLegacyDeflectionClaimAdjuster(0.25),
      new TieredLegacyDeflectionClaimAdjuster([999, 1976, 2662, 4788], [0.89, 0.88, 0.99, 0.93]),
      new PercentLegacyDeflectionClaimAdjuster(1.9),
    ],
    [],
    0.3,
    9383.3,
  );
}
