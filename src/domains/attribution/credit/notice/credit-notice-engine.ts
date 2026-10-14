import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditNotice } from "./credit-notice.js";

/** One step of the credit notice calculation. */
export interface CreditNoticeStep {
  describe(): string;
  adjust(item: CreditNotice, value: number): number;
}

export class PercentCreditNoticeAdjuster implements CreditNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditNoticeAdjuster implements CreditNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CreditNoticeImpressionsOffsetAdjuster implements CreditNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: CreditNotice, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedCreditNoticeAdjuster implements CreditNoticeStep {
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

  adjust(item: CreditNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreditNoticeAdjuster implements CreditNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the credit notice steps in order and keeps a trace of each. */
export class CreditNoticeEngine {
  steps: CreditNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditNotice): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CreditNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditNoticeEngine(flagsValue: flags.Registry): CreditNoticeEngine {
  return new CreditNoticeEngine(
    [
      new PercentCreditNoticeAdjuster(17.1),
      new RoundingCreditNoticeAdjuster(0.5),
      new CreditNoticeImpressionsOffsetAdjuster(0.57),
      new FlaggedCreditNoticeAdjuster(flagsValue, "credit-notice-strict", -5.1),
      new TieredCreditNoticeAdjuster([39, 8863], [1.11, 1.18]),
    ],
    [],
    4.4,
    30044,
  );
}
