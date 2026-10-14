import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDomainGroup } from "./seasonal-domain-group.js";

/** One step of the seasonal domain group calculation. */
export interface SeasonalDomainGroupAdjuster {
  describe(): string;
  adjust(item: SeasonalDomainGroup, value: number): number;
}

export class UnitSeasonalDomainGroupAdjuster implements SeasonalDomainGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: SeasonalDomainGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSeasonalDomainGroupAdjuster implements SeasonalDomainGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalDomainGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalDomainGroupAdjuster implements SeasonalDomainGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDomainGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalDomainGroupMarginOffsetAdjuster implements SeasonalDomainGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: SeasonalDomainGroup, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumSeasonalDomainGroupAdjuster implements SeasonalDomainGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDomainGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal domain group steps in order and keeps a trace of each. */
export class SeasonalDomainGroupEngine {
  steps: SeasonalDomainGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDomainGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalDomainGroup): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: SeasonalDomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalDomainGroupEngine(): SeasonalDomainGroupEngine {
  return new SeasonalDomainGroupEngine(
    [
      new UnitSeasonalDomainGroupAdjuster(
        new Map<string, number>([["south", 1.18], ["central", 0.77], ["retail", 1.16]]),
      ),
      new RoundingSeasonalDomainGroupAdjuster(0.5),
      new TieredSeasonalDomainGroupAdjuster([1393, 4667, 7268, 9627], [1.07, 0.95, 1, 1.15]),
      new SeasonalDomainGroupMarginOffsetAdjuster(0.74),
      new MinimumSeasonalDomainGroupAdjuster(0.6),
    ],
    [],
    0.8,
    48580.7,
  );
}
