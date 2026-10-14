import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientBidRuleAgreement } from "./lenient-bid-rule-agreement.js";

/** One step of the lenient bid rule agreement calculation. */
export interface LenientBidRuleAgreementStep {
  describe(): string;
  adjust(item: LenientBidRuleAgreement, value: number): number;
}

export class PercentLenientBidRuleAgreementAdjuster implements LenientBidRuleAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientBidRuleAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientBidRuleAgreementAdjuster implements LenientBidRuleAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientBidRuleAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientBidRuleAgreementEndsAtOffsetAdjuster implements LenientBidRuleAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: LenientBidRuleAgreement, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TieredLenientBidRuleAgreementAdjuster implements LenientBidRuleAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientBidRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientBidRuleAgreementAdjuster implements LenientBidRuleAgreementStep {
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

  adjust(item: LenientBidRuleAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient bid rule agreement steps in order and keeps a trace of each. */
export class LenientBidRuleAgreementEngine {
  steps: LenientBidRuleAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientBidRuleAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientBidRuleAgreement): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LenientBidRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientBidRuleAgreementEngine(flagsValue: flags.Registry): LenientBidRuleAgreementEngine {
  return new LenientBidRuleAgreementEngine(
    [
      new PercentLenientBidRuleAgreementAdjuster(-19.7),
      new RoundingLenientBidRuleAgreementAdjuster(5),
      new LenientBidRuleAgreementEndsAtOffsetAdjuster(1.28),
      new TieredLenientBidRuleAgreementAdjuster([1691, 5452, 8264], [1.04, 0.93, 1.16]),
      new FlaggedLenientBidRuleAgreementAdjuster(flagsValue, "lenient-bid-rule-agreement-default", 0.8),
    ],
    [],
    1.4,
    38008.3,
  );
}
