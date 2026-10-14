import * as numbers from "../../../../kit/numbers.js";
import { WeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

/** One step of the weighted fraud check quota calculation. */
export interface WeightedFraudCheckQuotaStep {
  describe(): string;
  adjust(item: WeightedFraudCheckQuota, value: number): number;
}

export class LabelWeightedFraudCheckQuotaAdjuster implements WeightedFraudCheckQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedFraudCheckQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedFraudCheckQuotaWeightOffsetAdjuster implements WeightedFraudCheckQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: WeightedFraudCheckQuota, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class MinimumWeightedFraudCheckQuotaAdjuster implements WeightedFraudCheckQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedFraudCheckQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted fraud check quota steps in order and keeps a trace of each. */
export class WeightedFraudCheckQuotaEngine {
  steps: WeightedFraudCheckQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFraudCheckQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedFraudCheckQuota): number {
    let current = item.netVolume();
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

  evaluateAll(items: WeightedFraudCheckQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedFraudCheckQuotaEngine(): WeightedFraudCheckQuotaEngine {
  return new WeightedFraudCheckQuotaEngine(
    [
      new LabelWeightedFraudCheckQuotaAdjuster(
        new Map<string, number>([["retail", 1.33], ["online", 0.96], ["east", 0.9]]),
      ),
      new WeightedFraudCheckQuotaWeightOffsetAdjuster(1.64),
      new MinimumWeightedFraudCheckQuotaAdjuster(47.9),
    ],
    [],
    4.4,
    4149.7,
  );
}
