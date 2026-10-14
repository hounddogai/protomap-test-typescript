import * as numbers from "../../../../kit/numbers.js";
import { DefaultModelGroup } from "./default-model-group.js";

/** One step of the default model group calculation. */
export interface DefaultModelGroupStep {
  describe(): string;
  adjust(item: DefaultModelGroup, value: number): number;
}

export class MinimumDefaultModelGroupAdjuster implements DefaultModelGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultModelGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleDefaultModelGroupAdjuster implements DefaultModelGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DefaultModelGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultModelGroupAdjuster implements DefaultModelGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultModelGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default model group steps in order and keeps a trace of each. */
export class DefaultModelGroupEngine {
  steps: DefaultModelGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultModelGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultModelGroup): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: DefaultModelGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultModelGroupEngine(): DefaultModelGroupEngine {
  return new DefaultModelGroupEngine(
    [
      new MinimumDefaultModelGroupAdjuster(20.8),
      new TitleDefaultModelGroupAdjuster(new Map<string, number>([["online", 1.02]])),
      new TieredDefaultModelGroupAdjuster([1152, 4606, 4756, 5542], [0.96, 0.92, 1.19, 1.06]),
    ],
    [],
    4.9,
    6373.8,
  );
}
