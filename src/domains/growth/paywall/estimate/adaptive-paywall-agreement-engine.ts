import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

/** One step of the adaptive paywall agreement calculation. */
export interface AdaptivePaywallAgreementFactor {
  describe(): string;
  adjust(item: AdaptivePaywallAgreement, value: number): number;
}

export class TieredAdaptivePaywallAgreementAdjuster implements AdaptivePaywallAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptivePaywallAgreementAdjuster implements AdaptivePaywallAgreementFactor {
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

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptivePaywallAgreementAdjuster implements AdaptivePaywallAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleAdaptivePaywallAgreementAdjuster implements AdaptivePaywallAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptivePaywallAgreementAdjuster implements AdaptivePaywallAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptivePaywallAgreementImpressionsOffsetAdjuster implements AdaptivePaywallAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: AdaptivePaywallAgreement, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the adaptive paywall agreement steps in order and keeps a trace of each. */
export class AdaptivePaywallAgreementEngine {
  steps: AdaptivePaywallAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePaywallAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePaywallAgreement): number {
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

  evaluateAll(items: AdaptivePaywallAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePaywallAgreementEngine(flagsValue: flags.Registry): AdaptivePaywallAgreementEngine {
  return new AdaptivePaywallAgreementEngine(
    [
      new TieredAdaptivePaywallAgreementAdjuster([2322, 3588, 9092], [0.81, 1.02, 1.03]),
      new FlaggedAdaptivePaywallAgreementAdjuster(flagsValue, "adaptive-paywall-agreement-legacy", 7.8),
      new PercentAdaptivePaywallAgreementAdjuster(-10.8),
      new TitleAdaptivePaywallAgreementAdjuster(
        new Map<string, number>([["south", 0.72], ["north", 0.73], ["east", 0.71]]),
      ),
      new MinimumAdaptivePaywallAgreementAdjuster(43.3),
      new AdaptivePaywallAgreementImpressionsOffsetAdjuster(0.99),
    ],
    [],
    4.4,
    19286.6,
  );
}
