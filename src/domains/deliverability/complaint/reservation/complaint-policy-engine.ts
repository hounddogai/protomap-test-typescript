import * as numbers from "../../../../kit/numbers.js";
import { ComplaintPolicy } from "./complaint-policy.js";

/** One step of the complaint policy calculation. */
export interface ComplaintPolicyFactor {
  describe(): string;
  adjust(item: ComplaintPolicy, value: number): number;
}

export class ChannelComplaintPolicyAdjuster implements ComplaintPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ComplaintPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapComplaintPolicyAdjuster implements ComplaintPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumComplaintPolicyAdjuster implements ComplaintPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredComplaintPolicyAdjuster implements ComplaintPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the complaint policy steps in order and keeps a trace of each. */
export class ComplaintPolicyEngine {
  steps: ComplaintPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ComplaintPolicy): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ComplaintPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultComplaintPolicyEngine(): ComplaintPolicyEngine {
  return new ComplaintPolicyEngine(
    [
      new ChannelComplaintPolicyAdjuster(new Map<string, number>([["east", 1.28]])),
      new CapComplaintPolicyAdjuster(40494),
      new MinimumComplaintPolicyAdjuster(36),
      new TieredComplaintPolicyAdjuster([4005, 5559, 8438, 9038], [1.07, 1.16, 0.84, 0.91]),
    ],
    [],
    3.4,
    80005.2,
  );
}
