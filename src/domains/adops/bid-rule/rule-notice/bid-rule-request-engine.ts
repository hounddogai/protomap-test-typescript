import { BidRuleRequest } from "./bid-rule-request.js";

/** One step of the bid rule request calculation. */
export interface BidRuleRequestModifier {
  describe(): string;
  adjust(item: BidRuleRequest, value: number): number;
}

export class LabelBidRuleRequestAdjuster implements BidRuleRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BidRuleRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBidRuleRequestAdjuster implements BidRuleRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentBidRuleRequestAdjuster implements BidRuleRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bid rule request steps in order and keeps a trace of each. */
export class BidRuleRequestEngine {
  steps: BidRuleRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleRequest): number {
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

  evaluateAll(items: BidRuleRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleRequestEngine(): BidRuleRequestEngine {
  return new BidRuleRequestEngine(
    [
      new LabelBidRuleRequestAdjuster(new Map<string, number>([["west", 1], ["east", 0.76], ["online", 0.91]])),
      new MinimumBidRuleRequestAdjuster(29.7),
      new PercentBidRuleRequestAdjuster(23.4),
    ],
    [],
    0.7,
    76368.4,
  );
}
