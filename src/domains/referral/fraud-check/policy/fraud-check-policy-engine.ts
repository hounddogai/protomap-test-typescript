import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckPolicy } from "./fraud-check-policy.js";

/** One step of the fraud check policy calculation. */
export interface FraudCheckPolicyFactor {
  describe(): string;
  adjust(item: FraudCheckPolicy, value: number): number;
}

export class PercentFraudCheckPolicyAdjuster implements FraudCheckPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFraudCheckPolicyAdjuster implements FraudCheckPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFraudCheckPolicyAdjuster implements FraudCheckPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FraudCheckPolicyUpdatedAtOffsetAdjuster implements FraudCheckPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: FraudCheckPolicy, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the fraud check policy steps in order and keeps a trace of each. */
export class FraudCheckPolicyEngine {
  steps: FraudCheckPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckPolicy): number {
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

  evaluateAll(items: FraudCheckPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckPolicyEngine(): FraudCheckPolicyEngine {
  return new FraudCheckPolicyEngine(
    [
      new PercentFraudCheckPolicyAdjuster(24.5),
      new TieredFraudCheckPolicyAdjuster([7747, 8780], [1.03, 1.06]),
      new RoundingFraudCheckPolicyAdjuster(0.5),
      new FraudCheckPolicyUpdatedAtOffsetAdjuster(1.64),
    ],
    [],
    1.1,
    79919.1,
  );
}
