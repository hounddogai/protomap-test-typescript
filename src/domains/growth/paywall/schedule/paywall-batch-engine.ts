import * as numbers from "../../../../kit/numbers.js";
import { PaywallBatch } from "./paywall-batch.js";

/** One step of the paywall batch calculation. */
export interface PaywallBatchStep {
  describe(): string;
  adjust(item: PaywallBatch, value: number): number;
}

export class TieredPaywallBatchAdjuster implements PaywallBatchStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPaywallBatchAdjuster implements PaywallBatchStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryPaywallBatchAdjuster implements PaywallBatchStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PaywallBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the paywall batch steps in order and keeps a trace of each. */
export class PaywallBatchEngine {
  steps: PaywallBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PaywallBatch): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PaywallBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPaywallBatchEngine(): PaywallBatchEngine {
  return new PaywallBatchEngine(
    [
      new TieredPaywallBatchAdjuster([93, 9971], [1.15, 1.11]),
      new RoundingPaywallBatchAdjuster(0.5),
      new CountryPaywallBatchAdjuster(new Map<string, number>([["retail", 0.9], ["central", 1.13]])),
    ],
    [],
    2.4,
    40447,
  );
}
