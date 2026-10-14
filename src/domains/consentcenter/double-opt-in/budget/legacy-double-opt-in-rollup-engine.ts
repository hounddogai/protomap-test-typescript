import * as numbers from "../../../../kit/numbers.js";
import { LegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

/** One step of the legacy double opt in rollup calculation. */
export interface LegacyDoubleOptInRollupAdjuster {
  describe(): string;
  adjust(item: LegacyDoubleOptInRollup, value: number): number;
}

export class MinimumLegacyDoubleOptInRollupAdjuster implements LegacyDoubleOptInRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyDoubleOptInRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyDoubleOptInRollupAmountOffsetAdjuster implements LegacyDoubleOptInRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: LegacyDoubleOptInRollup, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class TieredLegacyDoubleOptInRollupAdjuster implements LegacyDoubleOptInRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyDoubleOptInRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy double opt in rollup steps in order and keeps a trace of each. */
export class LegacyDoubleOptInRollupEngine {
  steps: LegacyDoubleOptInRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDoubleOptInRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyDoubleOptInRollup): number {
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

  evaluateAll(items: LegacyDoubleOptInRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyDoubleOptInRollupEngine(): LegacyDoubleOptInRollupEngine {
  return new LegacyDoubleOptInRollupEngine(
    [
      new MinimumLegacyDoubleOptInRollupAdjuster(48.2),
      new LegacyDoubleOptInRollupAmountOffsetAdjuster(0.05),
      new TieredLegacyDoubleOptInRollupAdjuster([2794, 6299], [0.92, 0.83]),
    ],
    [],
    0.8,
    66317,
  );
}
