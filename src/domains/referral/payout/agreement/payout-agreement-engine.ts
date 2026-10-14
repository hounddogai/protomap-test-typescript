import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutAgreement } from "./payout-agreement.js";

/** One step of the payout agreement calculation. */
export interface PayoutAgreementModifier {
  describe(): string;
  adjust(item: PayoutAgreement, value: number): number;
}

export class CountryPayoutAgreementAdjuster implements PayoutAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PayoutAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PayoutAgreementRatioOffsetAdjuster implements PayoutAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: PayoutAgreement, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedPayoutAgreementAdjuster implements PayoutAgreementModifier {
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

  adjust(item: PayoutAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout agreement steps in order and keeps a trace of each. */
export class PayoutAgreementEngine {
  steps: PayoutAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutAgreement): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PayoutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutAgreementEngine(flagsValue: flags.Registry): PayoutAgreementEngine {
  return new PayoutAgreementEngine(
    [
      new CountryPayoutAgreementAdjuster(new Map<string, number>([["online", 1.29], ["north", 0.93]])),
      new PayoutAgreementRatioOffsetAdjuster(1.29),
      new FlaggedPayoutAgreementAdjuster(flagsValue, "payout-agreement-fallback", 9.9),
    ],
    [],
    3.2,
    81769.2,
  );
}
