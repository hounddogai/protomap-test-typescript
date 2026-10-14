import * as numbers from "../../../../kit/numbers.js";
import { DeflectionClaim } from "./deflection-claim.js";

/** One step of the deflection claim calculation. */
export interface DeflectionClaimFactor {
  describe(): string;
  adjust(item: DeflectionClaim, value: number): number;
}

export class DeflectionClaimAmountOffsetAdjuster implements DeflectionClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: DeflectionClaim, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingDeflectionClaimAdjuster implements DeflectionClaimFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDeflectionClaimAdjuster implements DeflectionClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the deflection claim steps in order and keeps a trace of each. */
export class DeflectionClaimEngine {
  steps: DeflectionClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionClaim): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DeflectionClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionClaimEngine(): DeflectionClaimEngine {
  return new DeflectionClaimEngine(
    [
      new DeflectionClaimAmountOffsetAdjuster(0.02),
      new RoundingDeflectionClaimAdjuster(0.05),
      new TieredDeflectionClaimAdjuster([228, 242, 1056, 4099], [1.15, 0.97, 1, 0.99]),
    ],
    [],
    1.2,
    29197.9,
  );
}
