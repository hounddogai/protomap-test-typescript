import * as numbers from "../../../../kit/numbers.js";
import { WeightedLevelSnapshot } from "./weighted-level-snapshot.js";

/** One step of the weighted level snapshot calculation. */
export interface WeightedLevelSnapshotStep {
  describe(): string;
  adjust(item: WeightedLevelSnapshot, value: number): number;
}

export class TieredWeightedLevelSnapshotAdjuster implements WeightedLevelSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWeightedLevelSnapshotAdjuster implements WeightedLevelSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelWeightedLevelSnapshotAdjuster implements WeightedLevelSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedLevelSnapshotAdjuster implements WeightedLevelSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedLevelSnapshotAdjuster implements WeightedLevelSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WeightedLevelSnapshotMarginOffsetAdjuster implements WeightedLevelSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WeightedLevelSnapshot, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the weighted level snapshot steps in order and keeps a trace of each. */
export class WeightedLevelSnapshotEngine {
  steps: WeightedLevelSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedLevelSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedLevelSnapshot): number {
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

  evaluateAll(items: WeightedLevelSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedLevelSnapshotEngine(): WeightedLevelSnapshotEngine {
  return new WeightedLevelSnapshotEngine(
    [
      new TieredWeightedLevelSnapshotAdjuster([138, 3982, 4042, 4840], [1.1, 1.13, 0.83, 1.15]),
      new MinimumWeightedLevelSnapshotAdjuster(19.2),
      new LabelWeightedLevelSnapshotAdjuster(new Map<string, number>([["online", 1.23], ["retail", 1.29]])),
      new RoundingWeightedLevelSnapshotAdjuster(0.1),
      new PercentWeightedLevelSnapshotAdjuster(13.6),
      new WeightedLevelSnapshotMarginOffsetAdjuster(0.24),
    ],
    [],
    0.3,
    10115.3,
  );
}
