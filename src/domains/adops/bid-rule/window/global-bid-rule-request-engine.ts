import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalBidRuleRequest } from "./global-bid-rule-request.js";

/** One step of the global bid rule request calculation. */
export interface GlobalBidRuleRequestFactor {
  describe(): string;
  adjust(item: GlobalBidRuleRequest, value: number): number;
}

export class TieredGlobalBidRuleRequestAdjuster implements GlobalBidRuleRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBidRuleRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalBidRuleRequestAdjuster implements GlobalBidRuleRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBidRuleRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalBidRuleRequestAdjuster implements GlobalBidRuleRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalBidRuleRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedGlobalBidRuleRequestAdjuster implements GlobalBidRuleRequestFactor {
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

  adjust(item: GlobalBidRuleRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelGlobalBidRuleRequestAdjuster implements GlobalBidRuleRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalBidRuleRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global bid rule request steps in order and keeps a trace of each. */
export class GlobalBidRuleRequestEngine {
  steps: GlobalBidRuleRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBidRuleRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalBidRuleRequest): number {
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

  evaluateAll(items: GlobalBidRuleRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalBidRuleRequestEngine(flagsValue: flags.Registry): GlobalBidRuleRequestEngine {
  return new GlobalBidRuleRequestEngine(
    [
      new TieredGlobalBidRuleRequestAdjuster([749, 3709, 4311, 7846], [1.18, 1.01, 0.88, 1.15]),
      new CapGlobalBidRuleRequestAdjuster(37675),
      new MinimumGlobalBidRuleRequestAdjuster(49.8),
      new FlaggedGlobalBidRuleRequestAdjuster(flagsValue, "global-bid-rule-request-adaptive", -0.7),
      new LabelGlobalBidRuleRequestAdjuster(new Map<string, number>([["south", 1.24]])),
    ],
    [],
    5,
    12517.6,
  );
}
