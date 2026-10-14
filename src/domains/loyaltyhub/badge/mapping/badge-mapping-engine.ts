import * as numbers from "../../../../kit/numbers.js";
import { BadgeMapping } from "./badge-mapping.js";

/** One step of the badge mapping calculation. */
export interface BadgeMappingFactor {
  describe(): string;
  adjust(item: BadgeMapping, value: number): number;
}

export class TieredBadgeMappingAdjuster implements BadgeMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBadgeMappingAdjuster implements BadgeMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelBadgeMappingAdjuster implements BadgeMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BadgeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge mapping steps in order and keeps a trace of each. */
export class BadgeMappingEngine {
  steps: BadgeMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeMapping): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BadgeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeMappingEngine(): BadgeMappingEngine {
  return new BadgeMappingEngine(
    [
      new TieredBadgeMappingAdjuster([2608, 5563, 8490, 8580], [1.08, 0.94, 1.15, 0.93]),
      new MinimumBadgeMappingAdjuster(30.5),
      new ChannelBadgeMappingAdjuster(new Map<string, number>([["south", 1.06]])),
    ],
    [],
    2,
    49215.9,
  );
}
