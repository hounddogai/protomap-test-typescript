import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultExitRuleClaim } from "./default-exit-rule-claim.js";

/** One step of the default exit rule claim calculation. */
export interface DefaultExitRuleClaimFactor {
  describe(): string;
  adjust(item: DefaultExitRuleClaim, value: number): number;
}

export class FlaggedDefaultExitRuleClaimAdjuster implements DefaultExitRuleClaimFactor {
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

  adjust(item: DefaultExitRuleClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultExitRuleClaimAdjuster implements DefaultExitRuleClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultExitRuleClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultExitRuleClaimAdjuster implements DefaultExitRuleClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultExitRuleClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default exit rule claim steps in order and keeps a trace of each. */
export class DefaultExitRuleClaimEngine {
  steps: DefaultExitRuleClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultExitRuleClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultExitRuleClaim): number {
    let current = item.weightedValue();
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

  evaluateAll(items: DefaultExitRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultExitRuleClaimEngine(flagsValue: flags.Registry): DefaultExitRuleClaimEngine {
  return new DefaultExitRuleClaimEngine(
    [
      new FlaggedDefaultExitRuleClaimAdjuster(flagsValue, "default-exit-rule-claim-legacy", -6.1),
      new CapDefaultExitRuleClaimAdjuster(22677),
      new TieredDefaultExitRuleClaimAdjuster([1104, 2765, 3511, 8559], [1.04, 0.85, 1.17, 1]),
    ],
    [],
    3.4,
    11304.7,
  );
}
