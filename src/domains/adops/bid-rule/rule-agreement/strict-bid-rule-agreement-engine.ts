import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

/** One step of the strict bid rule agreement calculation. */
export interface StrictBidRuleAgreementAdjuster {
  describe(): string;
  adjust(item: StrictBidRuleAgreement, value: number): number;
}

export class SourceStrictBidRuleAgreementAdjuster implements StrictBidRuleAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: StrictBidRuleAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictBidRuleAgreementAdjuster implements StrictBidRuleAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictBidRuleAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictBidRuleAgreementAdjuster implements StrictBidRuleAgreementAdjuster {
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

  adjust(item: StrictBidRuleAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictBidRuleAgreementAdjuster implements StrictBidRuleAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictBidRuleAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStrictBidRuleAgreementAdjuster implements StrictBidRuleAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictBidRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict bid rule agreement steps in order and keeps a trace of each. */
export class StrictBidRuleAgreementEngine {
  steps: StrictBidRuleAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBidRuleAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictBidRuleAgreement): number {
    let current = item.netTotal();
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

  evaluateAll(items: StrictBidRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictBidRuleAgreementEngine(flagsValue: flags.Registry): StrictBidRuleAgreementEngine {
  return new StrictBidRuleAgreementEngine(
    [
      new SourceStrictBidRuleAgreementAdjuster(new Map<string, number>([["retail", 0.78]])),
      new MinimumStrictBidRuleAgreementAdjuster(44),
      new FlaggedStrictBidRuleAgreementAdjuster(flagsValue, "strict-bid-rule-agreement-weighted", 8.4),
      new RoundingStrictBidRuleAgreementAdjuster(5),
      new TieredStrictBidRuleAgreementAdjuster([6114, 7516, 8289], [0.88, 1.02, 0.9]),
    ],
    [],
    0.2,
    49231.9,
  );
}
