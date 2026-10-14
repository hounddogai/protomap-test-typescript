import * as numbers from "../../../../kit/numbers.js";
import { PendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

/** One step of the pending fraud check mapping calculation. */
export interface PendingFraudCheckMappingStep {
  describe(): string;
  adjust(item: PendingFraudCheckMapping, value: number): number;
}

export class TieredPendingFraudCheckMappingAdjuster implements PendingFraudCheckMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingFraudCheckMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPendingFraudCheckMappingAdjuster implements PendingFraudCheckMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingFraudCheckMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelPendingFraudCheckMappingAdjuster implements PendingFraudCheckMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingFraudCheckMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending fraud check mapping steps in order and keeps a trace of each. */
export class PendingFraudCheckMappingEngine {
  steps: PendingFraudCheckMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFraudCheckMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingFraudCheckMapping): number {
    let current = item.netTotal();
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

  evaluateAll(items: PendingFraudCheckMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingFraudCheckMappingEngine(): PendingFraudCheckMappingEngine {
  return new PendingFraudCheckMappingEngine(
    [
      new TieredPendingFraudCheckMappingAdjuster([3693, 5735, 6995], [0.95, 0.92, 1.15]),
      new PercentPendingFraudCheckMappingAdjuster(1.2),
      new LabelPendingFraudCheckMappingAdjuster(new Map<string, number>([["central", 1.31]])),
    ],
    [],
    1,
    60953.5,
  );
}
