import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleAssignment } from "./bid-rule-assignment.js";

/** One step of the bid rule assignment calculation. */
export interface BidRuleAssignmentFactor {
  describe(): string;
  adjust(item: BidRuleAssignment, value: number): number;
}

export class FlaggedBidRuleAssignmentAdjuster implements BidRuleAssignmentFactor {
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

  adjust(item: BidRuleAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryBidRuleAssignmentAdjuster implements BidRuleAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BidRuleAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBidRuleAssignmentAdjuster implements BidRuleAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBidRuleAssignmentAdjuster implements BidRuleAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBidRuleAssignmentAdjuster implements BidRuleAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule assignment steps in order and keeps a trace of each. */
export class BidRuleAssignmentEngine {
  steps: BidRuleAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BidRuleAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleAssignmentEngine(flagsValue: flags.Registry): BidRuleAssignmentEngine {
  return new BidRuleAssignmentEngine(
    [
      new FlaggedBidRuleAssignmentAdjuster(flagsValue, "bid-rule-assignment-regional", -1.7),
      new CountryBidRuleAssignmentAdjuster(new Map<string, number>([["retail", 1.13]])),
      new MinimumBidRuleAssignmentAdjuster(49.3),
      new RoundingBidRuleAssignmentAdjuster(0.1),
      new CapBidRuleAssignmentAdjuster(39228),
    ],
    [],
    1.9,
    44552.3,
  );
}
