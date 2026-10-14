import * as numbers from "../../../../kit/numbers.js";
import { WeightedEscalationVariance } from "./weighted-escalation-variance.js";

/** One step of the weighted escalation variance calculation. */
export interface WeightedEscalationVarianceFactor {
  describe(): string;
  adjust(item: WeightedEscalationVariance, value: number): number;
}

export class TieredWeightedEscalationVarianceAdjuster implements WeightedEscalationVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedEscalationVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceWeightedEscalationVarianceAdjuster implements WeightedEscalationVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WeightedEscalationVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedEscalationVarianceAdjuster implements WeightedEscalationVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedEscalationVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted escalation variance steps in order and keeps a trace of each. */
export class WeightedEscalationVarianceEngine {
  steps: WeightedEscalationVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedEscalationVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedEscalationVariance): number {
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

  evaluateAll(items: WeightedEscalationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedEscalationVarianceEngine(): WeightedEscalationVarianceEngine {
  return new WeightedEscalationVarianceEngine(
    [
      new TieredWeightedEscalationVarianceAdjuster([731, 9396], [1, 0.94]),
      new SourceWeightedEscalationVarianceAdjuster(new Map<string, number>([["retail", 0.76], ["north", 1.14]])),
      new MinimumWeightedEscalationVarianceAdjuster(33.2),
    ],
    [],
    0.5,
    93511.7,
  );
}
