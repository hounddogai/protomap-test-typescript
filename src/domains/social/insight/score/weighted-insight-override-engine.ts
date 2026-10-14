import * as numbers from "../../../../kit/numbers.js";
import { WeightedInsightOverride } from "./weighted-insight-override.js";

/** One step of the weighted insight override calculation. */
export interface WeightedInsightOverrideFactor {
  describe(): string;
  adjust(item: WeightedInsightOverride, value: number): number;
}

export class SourceWeightedInsightOverrideAdjuster implements WeightedInsightOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedInsightOverrideAdjuster implements WeightedInsightOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedInsightOverrideAdjuster implements WeightedInsightOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedInsightOverrideAdjuster implements WeightedInsightOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedInsightOverrideCostOffsetAdjuster implements WeightedInsightOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapWeightedInsightOverrideAdjuster implements WeightedInsightOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedInsightOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted insight override steps in order and keeps a trace of each. */
export class WeightedInsightOverrideEngine {
  steps: WeightedInsightOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedInsightOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedInsightOverride): number {
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

  evaluateAll(items: WeightedInsightOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedInsightOverrideEngine(): WeightedInsightOverrideEngine {
  return new WeightedInsightOverrideEngine(
    [
      new SourceWeightedInsightOverrideAdjuster(
        new Map<string, number>([["south", 0.73], ["east", 1.04], ["north", 1.22]]),
      ),
      new MinimumWeightedInsightOverrideAdjuster(4.9),
      new RoundingWeightedInsightOverrideAdjuster(0.25),
      new TieredWeightedInsightOverrideAdjuster([3125, 7339, 7790, 8245], [0.94, 0.87, 1.1, 0.85]),
      new WeightedInsightOverrideCostOffsetAdjuster(0.75),
      new CapWeightedInsightOverrideAdjuster(26194),
    ],
    [],
    2.5,
    58346.6,
  );
}
