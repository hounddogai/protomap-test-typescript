import * as numbers from "../../../../kit/numbers.js";
import { SeasonalConversionGroup } from "./seasonal-conversion-group.js";

/** One step of the seasonal conversion group calculation. */
export interface SeasonalConversionGroupModifier {
  describe(): string;
  adjust(item: SeasonalConversionGroup, value: number): number;
}

export class CapSeasonalConversionGroupAdjuster implements SeasonalConversionGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalConversionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalConversionGroupAdjuster implements SeasonalConversionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalConversionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSeasonalConversionGroupAdjuster implements SeasonalConversionGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalConversionGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalConversionGroupAdjuster implements SeasonalConversionGroupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalConversionGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalConversionGroupBatchSizeOffsetAdjuster implements SeasonalConversionGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SeasonalConversionGroup, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the seasonal conversion group steps in order and keeps a trace of each. */
export class SeasonalConversionGroupEngine {
  steps: SeasonalConversionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalConversionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalConversionGroup): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: SeasonalConversionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalConversionGroupEngine(): SeasonalConversionGroupEngine {
  return new SeasonalConversionGroupEngine(
    [
      new CapSeasonalConversionGroupAdjuster(13688),
      new RoundingSeasonalConversionGroupAdjuster(0.1),
      new MinimumSeasonalConversionGroupAdjuster(14.8),
      new TieredSeasonalConversionGroupAdjuster([3568, 4565, 6826, 9114], [0.9, 1.03, 0.85, 1.01]),
      new SeasonalConversionGroupBatchSizeOffsetAdjuster(0.79),
    ],
    [],
    3,
    29262.6,
  );
}
