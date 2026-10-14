import * as numbers from "../../../../kit/numbers.js";
import { WeightedReputationSummary } from "./weighted-reputation-summary.js";

/** One step of the weighted reputation summary calculation. */
export interface WeightedReputationSummaryStep {
  describe(): string;
  adjust(item: WeightedReputationSummary, value: number): number;
}

export class WeightedReputationSummaryPriorityOffsetAdjuster implements WeightedReputationSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: WeightedReputationSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class UtmSourceWeightedReputationSummaryAdjuster implements WeightedReputationSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: WeightedReputationSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedReputationSummaryAdjuster implements WeightedReputationSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedReputationSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWeightedReputationSummaryAdjuster implements WeightedReputationSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReputationSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted reputation summary steps in order and keeps a trace of each. */
export class WeightedReputationSummaryEngine {
  steps: WeightedReputationSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReputationSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedReputationSummary): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WeightedReputationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedReputationSummaryEngine(): WeightedReputationSummaryEngine {
  return new WeightedReputationSummaryEngine(
    [
      new WeightedReputationSummaryPriorityOffsetAdjuster(0.11),
      new UtmSourceWeightedReputationSummaryAdjuster(
        new Map<string, number>([["online", 0.81], ["retail", 1.17], ["central", 1.11]]),
      ),
      new TieredWeightedReputationSummaryAdjuster([1848, 8265, 9278], [1.01, 0.91, 0.88]),
      new CapWeightedReputationSummaryAdjuster(29703),
    ],
    [],
    4.1,
    34210.7,
  );
}
