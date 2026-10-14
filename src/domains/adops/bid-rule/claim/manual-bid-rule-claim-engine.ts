import * as flags from "../../../../kit/flags.js";
import { ManualBidRuleClaim } from "./manual-bid-rule-claim.js";

/** One step of the manual bid rule claim calculation. */
export interface ManualBidRuleClaimAdjuster {
  describe(): string;
  adjust(item: ManualBidRuleClaim, value: number): number;
}

export class ManualBidRuleClaimImpressionsOffsetAdjuster implements ManualBidRuleClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ManualBidRuleClaim, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapManualBidRuleClaimAdjuster implements ManualBidRuleClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBidRuleClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleManualBidRuleClaimAdjuster implements ManualBidRuleClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualBidRuleClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualBidRuleClaimAdjuster implements ManualBidRuleClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualBidRuleClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedManualBidRuleClaimAdjuster implements ManualBidRuleClaimAdjuster {
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

  adjust(item: ManualBidRuleClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual bid rule claim steps in order and keeps a trace of each. */
export class ManualBidRuleClaimEngine {
  steps: ManualBidRuleClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBidRuleClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualBidRuleClaim): number {
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

  evaluateAll(items: ManualBidRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualBidRuleClaimEngine(flagsValue: flags.Registry): ManualBidRuleClaimEngine {
  return new ManualBidRuleClaimEngine(
    [
      new ManualBidRuleClaimImpressionsOffsetAdjuster(0.35),
      new CapManualBidRuleClaimAdjuster(528),
      new LocaleManualBidRuleClaimAdjuster(new Map<string, number>([["west", 1.39], ["north", 1.37]])),
      new MinimumManualBidRuleClaimAdjuster(39.2),
      new FlaggedManualBidRuleClaimAdjuster(flagsValue, "manual-bid-rule-claim-tiered", 6.3),
    ],
    [],
    3.3,
    52561.4,
  );
}
