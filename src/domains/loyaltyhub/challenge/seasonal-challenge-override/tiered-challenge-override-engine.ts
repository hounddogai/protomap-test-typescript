import * as numbers from "../../../../kit/numbers.js";
import { TieredChallengeOverride } from "./tiered-challenge-override.js";

/** One step of the tiered challenge override calculation. */
export interface TieredChallengeOverrideFactor {
  describe(): string;
  adjust(item: TieredChallengeOverride, value: number): number;
}

export class CapTieredChallengeOverrideAdjuster implements TieredChallengeOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredChallengeOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredChallengeOverrideAdjuster implements TieredChallengeOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredChallengeOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTieredChallengeOverrideAdjuster implements TieredChallengeOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredChallengeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredChallengeOverrideAdjuster implements TieredChallengeOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredChallengeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitTieredChallengeOverrideAdjuster implements TieredChallengeOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredChallengeOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered challenge override steps in order and keeps a trace of each. */
export class TieredChallengeOverrideEngine {
  steps: TieredChallengeOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredChallengeOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredChallengeOverride): number {
    let current = item.netTotal();
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

  evaluateAll(items: TieredChallengeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredChallengeOverrideEngine(): TieredChallengeOverrideEngine {
  return new TieredChallengeOverrideEngine(
    [
      new CapTieredChallengeOverrideAdjuster(14406),
      new RoundingTieredChallengeOverrideAdjuster(1),
      new TieredTieredChallengeOverrideAdjuster([1339, 1942, 3391, 5284], [0.94, 0.85, 0.86, 0.9]),
      new MinimumTieredChallengeOverrideAdjuster(32.4),
      new UnitTieredChallengeOverrideAdjuster(
        new Map<string, number>([["west", 1.15], ["retail", 1.11], ["east", 0.87]]),
      ),
    ],
    [],
    3.6,
    63571.6,
  );
}
