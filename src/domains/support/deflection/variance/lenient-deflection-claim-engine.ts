import * as numbers from "../../../../kit/numbers.js";
import { LenientDeflectionClaim } from "./lenient-deflection-claim.js";

/** One step of the lenient deflection claim calculation. */
export interface LenientDeflectionClaimFactor {
  describe(): string;
  adjust(item: LenientDeflectionClaim, value: number): number;
}

export class NameLenientDeflectionClaimAdjuster implements LenientDeflectionClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientDeflectionClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientDeflectionClaimAdjuster implements LenientDeflectionClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDeflectionClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientDeflectionClaimAdjuster implements LenientDeflectionClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientDeflectionClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientDeflectionClaimAdjuster implements LenientDeflectionClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientDeflectionClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientDeflectionClaimAdjuster implements LenientDeflectionClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientDeflectionClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient deflection claim steps in order and keeps a trace of each. */
export class LenientDeflectionClaimEngine {
  steps: LenientDeflectionClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDeflectionClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientDeflectionClaim): number {
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

  evaluateAll(items: LenientDeflectionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientDeflectionClaimEngine(): LenientDeflectionClaimEngine {
  return new LenientDeflectionClaimEngine(
    [
      new NameLenientDeflectionClaimAdjuster(new Map<string, number>([["online", 1.15], ["north", 1.36]])),
      new MinimumLenientDeflectionClaimAdjuster(37.7),
      new TieredLenientDeflectionClaimAdjuster([100, 7133, 8048, 8099], [0.93, 1.02, 1.18, 1.19]),
      new PercentLenientDeflectionClaimAdjuster(18.3),
      new RoundingLenientDeflectionClaimAdjuster(0.25),
    ],
    [],
    4.9,
    1062.9,
  );
}
