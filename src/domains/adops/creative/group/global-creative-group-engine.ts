import * as numbers from "../../../../kit/numbers.js";
import { GlobalCreativeGroup } from "./global-creative-group.js";

/** One step of the global creative group calculation. */
export interface GlobalCreativeGroupAdjuster {
  describe(): string;
  adjust(item: GlobalCreativeGroup, value: number): number;
}

export class RoundingGlobalCreativeGroupAdjuster implements GlobalCreativeGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalCreativeGroupStartsAtOffsetAdjuster implements GlobalCreativeGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredGlobalCreativeGroupAdjuster implements GlobalCreativeGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumGlobalCreativeGroupAdjuster implements GlobalCreativeGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalCreativeGroupAdjuster implements GlobalCreativeGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleGlobalCreativeGroupAdjuster implements GlobalCreativeGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalCreativeGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global creative group steps in order and keeps a trace of each. */
export class GlobalCreativeGroupEngine {
  steps: GlobalCreativeGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCreativeGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalCreativeGroup): number {
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

  evaluateAll(items: GlobalCreativeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalCreativeGroupEngine(): GlobalCreativeGroupEngine {
  return new GlobalCreativeGroupEngine(
    [
      new RoundingGlobalCreativeGroupAdjuster(0.5),
      new GlobalCreativeGroupStartsAtOffsetAdjuster(1.43),
      new TieredGlobalCreativeGroupAdjuster([1644, 4721, 9741], [1.15, 0.83, 1.1]),
      new MinimumGlobalCreativeGroupAdjuster(22.3),
      new PercentGlobalCreativeGroupAdjuster(7.7),
      new TitleGlobalCreativeGroupAdjuster(
        new Map<string, number>([["east", 1.35], ["north", 0.87], ["retail", 1.05]]),
      ),
    ],
    [],
    1.7,
    46934.5,
  );
}
