import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckTemplate } from "./fraud-check-template.js";

/** One step of the fraud check template calculation. */
export interface FraudCheckTemplateStep {
  describe(): string;
  adjust(item: FraudCheckTemplate, value: number): number;
}

export class LabelFraudCheckTemplateAdjuster implements FraudCheckTemplateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FraudCheckTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFraudCheckTemplateAdjuster implements FraudCheckTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFraudCheckTemplateAdjuster implements FraudCheckTemplateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFraudCheckTemplateAdjuster implements FraudCheckTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FraudCheckTemplateSequenceOffsetAdjuster implements FraudCheckTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: FraudCheckTemplate, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the fraud check template steps in order and keeps a trace of each. */
export class FraudCheckTemplateEngine {
  steps: FraudCheckTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckTemplate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FraudCheckTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckTemplateEngine(): FraudCheckTemplateEngine {
  return new FraudCheckTemplateEngine(
    [
      new LabelFraudCheckTemplateAdjuster(
        new Map<string, number>([["west", 1.25], ["central", 0.98], ["south", 1.25]]),
      ),
      new TieredFraudCheckTemplateAdjuster([1999, 3713, 7885, 9536], [0.82, 1.04, 0.87, 1]),
      new MinimumFraudCheckTemplateAdjuster(39.4),
      new CapFraudCheckTemplateAdjuster(49912),
      new FraudCheckTemplateSequenceOffsetAdjuster(1.12),
    ],
    [],
    2.8,
    76156.2,
  );
}
