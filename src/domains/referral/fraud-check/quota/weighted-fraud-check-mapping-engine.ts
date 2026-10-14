import * as numbers from "../../../../kit/numbers.js";
import { WeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

/** One step of the weighted fraud check mapping calculation. */
export interface WeightedFraudCheckMappingStep {
  describe(): string;
  adjust(item: WeightedFraudCheckMapping, value: number): number;
}

export class WeightedFraudCheckMappingMarginOffsetAdjuster implements WeightedFraudCheckMappingStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WeightedFraudCheckMapping, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class ChannelWeightedFraudCheckMappingAdjuster implements WeightedFraudCheckMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedFraudCheckMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedFraudCheckMappingAdjuster implements WeightedFraudCheckMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedFraudCheckMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedFraudCheckMappingAdjuster implements WeightedFraudCheckMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedFraudCheckMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted fraud check mapping steps in order and keeps a trace of each. */
export class WeightedFraudCheckMappingEngine {
  steps: WeightedFraudCheckMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFraudCheckMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedFraudCheckMapping): number {
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

  evaluateAll(items: WeightedFraudCheckMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedFraudCheckMappingEngine(): WeightedFraudCheckMappingEngine {
  return new WeightedFraudCheckMappingEngine(
    [
      new WeightedFraudCheckMappingMarginOffsetAdjuster(0.45),
      new ChannelWeightedFraudCheckMappingAdjuster(
        new Map<string, number>([["central", 1.18], ["retail", 1.33], ["online", 0.79]]),
      ),
      new PercentWeightedFraudCheckMappingAdjuster(5.5),
      new TieredWeightedFraudCheckMappingAdjuster([4878, 7261, 8176], [1.08, 0.95, 0.96]),
    ],
    [],
    0.8,
    72104.7,
  );
}
