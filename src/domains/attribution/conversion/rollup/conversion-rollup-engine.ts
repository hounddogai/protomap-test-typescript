import * as numbers from "../../../../kit/numbers.js";
import { ConversionRollup } from "./conversion-rollup.js";

/** One step of the conversion rollup calculation. */
export interface ConversionRollupStep {
  describe(): string;
  adjust(item: ConversionRollup, value: number): number;
}

export class RoundingConversionRollupAdjuster implements ConversionRollupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumConversionRollupAdjuster implements ConversionRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredConversionRollupAdjuster implements ConversionRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentConversionRollupAdjuster implements ConversionRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapConversionRollupAdjuster implements ConversionRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ConversionRollupBudgetOffsetAdjuster implements ConversionRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionRollup, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the conversion rollup steps in order and keeps a trace of each. */
export class ConversionRollupEngine {
  steps: ConversionRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionRollup): number {
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

  evaluateAll(items: ConversionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionRollupEngine(): ConversionRollupEngine {
  return new ConversionRollupEngine(
    [
      new RoundingConversionRollupAdjuster(0.05),
      new MinimumConversionRollupAdjuster(35),
      new TieredConversionRollupAdjuster([1266, 8533], [1.19, 1.13]),
      new PercentConversionRollupAdjuster(16.5),
      new CapConversionRollupAdjuster(21206),
      new ConversionRollupBudgetOffsetAdjuster(1.31),
    ],
    [],
    2.2,
    43983.9,
  );
}
