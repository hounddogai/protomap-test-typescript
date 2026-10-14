import * as numbers from "../../../../kit/numbers.js";
import { CreativeMetric } from "./creative-metric.js";

/** One step of the creative metric calculation. */
export interface CreativeMetricStep {
  describe(): string;
  adjust(item: CreativeMetric, value: number): number;
}

export class CapCreativeMetricAdjuster implements CreativeMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CreativeMetricQuantityOffsetAdjuster implements CreativeMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CreativeMetric, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredCreativeMetricAdjuster implements CreativeMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeMetricAdjuster implements CreativeMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameCreativeMetricAdjuster implements CreativeMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative metric steps in order and keeps a trace of each. */
export class CreativeMetricEngine {
  steps: CreativeMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeMetric): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CreativeMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeMetricEngine(): CreativeMetricEngine {
  return new CreativeMetricEngine(
    [
      new CapCreativeMetricAdjuster(49414),
      new CreativeMetricQuantityOffsetAdjuster(0.88),
      new TieredCreativeMetricAdjuster([5675, 8037, 8575, 9892], [0.98, 0.98, 0.85, 0.85]),
      new RoundingCreativeMetricAdjuster(0.1),
      new NameCreativeMetricAdjuster(
        new Map<string, number>([["east", 1.38], ["online", 0.75], ["west", 1.39]]),
      ),
    ],
    [],
    2.7,
    44338,
  );
}
