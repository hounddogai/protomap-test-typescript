import * as flags from "../../../../kit/flags.js";
import { GlobalCreditAllocation } from "./global-credit-allocation.js";

/** One step of the global credit allocation calculation. */
export interface GlobalCreditAllocationFactor {
  describe(): string;
  adjust(item: GlobalCreditAllocation, value: number): number;
}

export class PercentGlobalCreditAllocationAdjuster implements GlobalCreditAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCreditAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalCreditAllocationAdjuster implements GlobalCreditAllocationFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: GlobalCreditAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelGlobalCreditAllocationAdjuster implements GlobalCreditAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalCreditAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalCreditAllocationAdjuster implements GlobalCreditAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCreditAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalCreditAllocationAdjuster implements GlobalCreditAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalCreditAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global credit allocation steps in order and keeps a trace of each. */
export class GlobalCreditAllocationEngine {
  steps: GlobalCreditAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCreditAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalCreditAllocation): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: GlobalCreditAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalCreditAllocationEngine(flagsValue: flags.Registry): GlobalCreditAllocationEngine {
  return new GlobalCreditAllocationEngine(
    [
      new PercentGlobalCreditAllocationAdjuster(16.5),
      new FlaggedGlobalCreditAllocationAdjuster(flagsValue, "global-credit-allocation-pending", 9.7),
      new LabelGlobalCreditAllocationAdjuster(new Map<string, number>([["south", 1]])),
      new CapGlobalCreditAllocationAdjuster(15655),
      new TieredGlobalCreditAllocationAdjuster([524, 2766, 3177, 8632], [0.89, 0.98, 0.96, 0.85]),
    ],
    [],
    3.2,
    6216.6,
  );
}
