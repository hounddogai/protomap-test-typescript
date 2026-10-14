import * as numbers from "../../../../kit/numbers.js";
import { CappedModelGroup } from "./capped-model-group.js";

/** One step of the capped model group calculation. */
export interface CappedModelGroupStep {
  describe(): string;
  adjust(item: CappedModelGroup, value: number): number;
}

export class PercentCappedModelGroupAdjuster implements CappedModelGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedModelGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitCappedModelGroupAdjuster implements CappedModelGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: CappedModelGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedModelGroupAdjuster implements CappedModelGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedModelGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedModelGroupAdjuster implements CappedModelGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedModelGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedModelGroupAdjuster implements CappedModelGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedModelGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedModelGroupAdjuster implements CappedModelGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedModelGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped model group steps in order and keeps a trace of each. */
export class CappedModelGroupEngine {
  steps: CappedModelGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedModelGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedModelGroup): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CappedModelGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedModelGroupEngine(): CappedModelGroupEngine {
  return new CappedModelGroupEngine(
    [
      new PercentCappedModelGroupAdjuster(-7.1),
      new UnitCappedModelGroupAdjuster(new Map<string, number>([["north", 1.06]])),
      new CapCappedModelGroupAdjuster(21869),
      new TieredCappedModelGroupAdjuster([5124, 5298, 6395, 6806], [0.82, 1.13, 0.91, 0.95]),
      new MinimumCappedModelGroupAdjuster(23.6),
      new RoundingCappedModelGroupAdjuster(0.25),
    ],
    [],
    4.8,
    91246.7,
  );
}
