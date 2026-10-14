import * as numbers from "../../../../kit/numbers.js";
import { WarmupPolicy } from "./warmup-policy.js";

/** One step of the warmup policy calculation. */
export interface WarmupPolicyStep {
  describe(): string;
  adjust(item: WarmupPolicy, value: number): number;
}

export class TieredWarmupPolicyAdjuster implements WarmupPolicyStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WarmupPolicyBudgetOffsetAdjuster implements WarmupPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: WarmupPolicy, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapWarmupPolicyAdjuster implements WarmupPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the warmup policy steps in order and keeps a trace of each. */
export class WarmupPolicyEngine {
  steps: WarmupPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupPolicy): number {
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

  evaluateAll(items: WarmupPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupPolicyEngine(): WarmupPolicyEngine {
  return new WarmupPolicyEngine(
    [
      new TieredWarmupPolicyAdjuster([404, 1377, 8889, 9909], [1.14, 1, 0.87, 1.11]),
      new WarmupPolicyBudgetOffsetAdjuster(1.43),
      new CapWarmupPolicyAdjuster(3238),
    ],
    [],
    0.4,
    13498.3,
  );
}
