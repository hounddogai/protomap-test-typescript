import * as numbers from "../../../../kit/numbers.js";
import { BidRuleAgreement } from "./bid-rule-agreement.js";

/** One step of the bid rule agreement calculation. */
export interface BidRuleAgreementModifier {
  describe(): string;
  adjust(item: BidRuleAgreement, value: number): number;
}

export class SourceBidRuleAgreementAdjuster implements BidRuleAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BidRuleAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBidRuleAgreementAdjuster implements BidRuleAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBidRuleAgreementAdjuster implements BidRuleAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bid rule agreement steps in order and keeps a trace of each. */
export class BidRuleAgreementEngine {
  steps: BidRuleAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleAgreement): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BidRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleAgreementEngine(): BidRuleAgreementEngine {
  return new BidRuleAgreementEngine(
    [
      new SourceBidRuleAgreementAdjuster(new Map<string, number>([["west", 0.72], ["south", 0.85]])),
      new PercentBidRuleAgreementAdjuster(6.6),
      new CapBidRuleAgreementAdjuster(40448),
    ],
    [],
    1.8,
    57784.3,
  );
}
