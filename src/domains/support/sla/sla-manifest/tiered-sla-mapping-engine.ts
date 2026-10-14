import * as numbers from "../../../../kit/numbers.js";
import { TieredSlaMapping } from "./tiered-sla-mapping.js";

/** One step of the tiered sla mapping calculation. */
export interface TieredSlaMappingFactor {
  describe(): string;
  adjust(item: TieredSlaMapping, value: number): number;
}

export class TieredTieredSlaMappingAdjuster implements TieredSlaMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSlaMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredSlaMappingAdjuster implements TieredSlaMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSlaMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredSlaMappingAdjuster implements TieredSlaMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSlaMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered sla mapping steps in order and keeps a trace of each. */
export class TieredSlaMappingEngine {
  steps: TieredSlaMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSlaMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredSlaMapping): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredSlaMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredSlaMappingEngine(): TieredSlaMappingEngine {
  return new TieredSlaMappingEngine(
    [
      new TieredTieredSlaMappingAdjuster([4583, 4874, 7895, 8569], [1.14, 1.02, 1.19, 1.03]),
      new RoundingTieredSlaMappingAdjuster(0.25),
      new MinimumTieredSlaMappingAdjuster(25.5),
    ],
    [],
    1.9,
    24383.9,
  );
}
