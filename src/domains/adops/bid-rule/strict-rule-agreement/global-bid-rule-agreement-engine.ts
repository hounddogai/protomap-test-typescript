import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalBidRuleAgreement } from "./global-bid-rule-agreement.js";

/** One step of the global bid rule agreement calculation. */
export interface GlobalBidRuleAgreementModifier {
  describe(): string;
  adjust(item: GlobalBidRuleAgreement, value: number): number;
}

export class PercentGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
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

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalBidRuleAgreementAdjuster implements GlobalBidRuleAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBidRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global bid rule agreement steps in order and keeps a trace of each. */
export class GlobalBidRuleAgreementEngine {
  steps: GlobalBidRuleAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBidRuleAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalBidRuleAgreement): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalBidRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalBidRuleAgreementEngine(flagsValue: flags.Registry): GlobalBidRuleAgreementEngine {
  return new GlobalBidRuleAgreementEngine(
    [
      new PercentGlobalBidRuleAgreementAdjuster(21.3),
      new FlaggedGlobalBidRuleAgreementAdjuster(flagsValue, "global-bid-rule-agreement-default", -5.4),
      new RoundingGlobalBidRuleAgreementAdjuster(0.25),
      new MinimumGlobalBidRuleAgreementAdjuster(19.4),
      new CapGlobalBidRuleAgreementAdjuster(46736),
      new TieredGlobalBidRuleAgreementAdjuster([1620, 5794], [0.96, 0.97]),
    ],
    [],
    2.8,
    78489.7,
  );
}
