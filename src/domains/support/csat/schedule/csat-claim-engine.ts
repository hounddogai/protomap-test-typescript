import * as numbers from "../../../../kit/numbers.js";
import { CsatClaim } from "./csat-claim.js";

/** One step of the csat claim calculation. */
export interface CsatClaimAdjuster {
  describe(): string;
  adjust(item: CsatClaim, value: number): number;
}

export class CsatClaimExpiresAtOffsetAdjuster implements CsatClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: CsatClaim, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingCsatClaimAdjuster implements CsatClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCsatClaimAdjuster implements CsatClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleCsatClaimAdjuster implements CsatClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CsatClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCsatClaimAdjuster implements CsatClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat claim steps in order and keeps a trace of each. */
export class CsatClaimEngine {
  steps: CsatClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatClaim): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CsatClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatClaimEngine(): CsatClaimEngine {
  return new CsatClaimEngine(
    [
      new CsatClaimExpiresAtOffsetAdjuster(0.47),
      new RoundingCsatClaimAdjuster(0.1),
      new MinimumCsatClaimAdjuster(4.8),
      new TitleCsatClaimAdjuster(new Map<string, number>([["retail", 0.75], ["west", 1.3], ["central", 0.76]])),
      new PercentCsatClaimAdjuster(15.9),
    ],
    [],
    3.1,
    16614.8,
  );
}
