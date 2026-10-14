import * as numbers from "../../../../kit/numbers.js";
import { WeightedPreferenceMapping } from "./weighted-preference-mapping.js";

/** One step of the weighted preference mapping calculation. */
export interface WeightedPreferenceMappingAdjuster {
  describe(): string;
  adjust(item: WeightedPreferenceMapping, value: number): number;
}

export class LocaleWeightedPreferenceMappingAdjuster implements WeightedPreferenceMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedPreferenceMappingAdjuster implements WeightedPreferenceMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWeightedPreferenceMappingAdjuster implements WeightedPreferenceMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedPreferenceMappingVersionOffsetAdjuster implements WeightedPreferenceMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapWeightedPreferenceMappingAdjuster implements WeightedPreferenceMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedPreferenceMappingAdjuster implements WeightedPreferenceMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedPreferenceMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted preference mapping steps in order and keeps a trace of each. */
export class WeightedPreferenceMappingEngine {
  steps: WeightedPreferenceMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPreferenceMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedPreferenceMapping): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WeightedPreferenceMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedPreferenceMappingEngine(): WeightedPreferenceMappingEngine {
  return new WeightedPreferenceMappingEngine(
    [
      new LocaleWeightedPreferenceMappingAdjuster(new Map<string, number>([["south", 1.27], ["online", 0.86]])),
      new TieredWeightedPreferenceMappingAdjuster([1051, 3954, 7616, 9076], [1.2, 0.83, 1.13, 0.84]),
      new MinimumWeightedPreferenceMappingAdjuster(48.8),
      new WeightedPreferenceMappingVersionOffsetAdjuster(0.09),
      new CapWeightedPreferenceMappingAdjuster(19383),
      new RoundingWeightedPreferenceMappingAdjuster(0.25),
    ],
    [],
    0.1,
    90291.7,
  );
}
