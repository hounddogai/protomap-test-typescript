import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleMapping } from "./bid-rule-mapping.js";

/** One step of the bid rule mapping calculation. */
export interface BidRuleMappingModifier {
  describe(): string;
  adjust(item: BidRuleMapping, value: number): number;
}

export class FlaggedBidRuleMappingAdjuster implements BidRuleMappingModifier {
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

  adjust(item: BidRuleMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBidRuleMappingAdjuster implements BidRuleMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBidRuleMappingAdjuster implements BidRuleMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bid rule mapping steps in order and keeps a trace of each. */
export class BidRuleMappingEngine {
  steps: BidRuleMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BidRuleMapping): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: BidRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBidRuleMappingEngine(flagsValue: flags.Registry): BidRuleMappingEngine {
  return new BidRuleMappingEngine(
    [
      new FlaggedBidRuleMappingAdjuster(flagsValue, "bid-rule-mapping-manual", 8.1),
      new CapBidRuleMappingAdjuster(18068),
      new MinimumBidRuleMappingAdjuster(13.6),
    ],
    [],
    0.5,
    1889.8,
  );
}
