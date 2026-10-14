import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackPayoutAgreement } from "./fallback-payout-agreement.js";

/** One step of the fallback payout agreement calculation. */
export interface FallbackPayoutAgreementAdjuster {
  describe(): string;
  adjust(item: FallbackPayoutAgreement, value: number): number;
}

export class CapFallbackPayoutAgreementAdjuster implements FallbackPayoutAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPayoutAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackPayoutAgreementMarginOffsetAdjuster implements FallbackPayoutAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: FallbackPayoutAgreement, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class TieredFallbackPayoutAgreementAdjuster implements FallbackPayoutAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPayoutAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackPayoutAgreementAdjuster implements FallbackPayoutAgreementAdjuster {
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

  adjust(item: FallbackPayoutAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackPayoutAgreementAdjuster implements FallbackPayoutAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPayoutAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback payout agreement steps in order and keeps a trace of each. */
export class FallbackPayoutAgreementEngine {
  steps: FallbackPayoutAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPayoutAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackPayoutAgreement): number {
    let current = item.netVolume();
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

  evaluateAll(items: FallbackPayoutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackPayoutAgreementEngine(flagsValue: flags.Registry): FallbackPayoutAgreementEngine {
  return new FallbackPayoutAgreementEngine(
    [
      new CapFallbackPayoutAgreementAdjuster(34114),
      new FallbackPayoutAgreementMarginOffsetAdjuster(0.12),
      new TieredFallbackPayoutAgreementAdjuster([4340, 5312], [0.81, 0.97]),
      new FlaggedFallbackPayoutAgreementAdjuster(flagsValue, "fallback-payout-agreement-default", 0.1),
      new RoundingFallbackPayoutAgreementAdjuster(0.5),
    ],
    [],
    1.6,
    66951.6,
  );
}
