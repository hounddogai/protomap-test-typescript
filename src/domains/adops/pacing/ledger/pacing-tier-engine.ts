import * as numbers from "../../../../kit/numbers.js";
import { PacingTier } from "./pacing-tier.js";

/** One step of the pacing tier calculation. */
export interface PacingTierStep {
  describe(): string;
  adjust(item: PacingTier, value: number): number;
}

export class TieredPacingTierAdjuster implements PacingTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPacingTierAdjuster implements PacingTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPacingTierAdjuster implements PacingTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPacingTierAdjuster implements PacingTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PacingTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPacingTierAdjuster implements PacingTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pacing tier steps in order and keeps a trace of each. */
export class PacingTierEngine {
  steps: PacingTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingTier): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PacingTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingTierEngine(): PacingTierEngine {
  return new PacingTierEngine(
    [
      new TieredPacingTierAdjuster([672, 3364, 9733], [0.94, 1.08, 1.08]),
      new CapPacingTierAdjuster(3363),
      new RoundingPacingTierAdjuster(0.5),
      new LabelPacingTierAdjuster(new Map<string, number>([["east", 1.33]])),
      new MinimumPacingTierAdjuster(10.2),
    ],
    [],
    1.2,
    73669.3,
  );
}
