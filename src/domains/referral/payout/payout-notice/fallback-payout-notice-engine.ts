import * as flags from "../../../../kit/flags.js";
import { FallbackPayoutNotice } from "./fallback-payout-notice.js";

/** One step of the fallback payout notice calculation. */
export interface FallbackPayoutNoticeModifier {
  describe(): string;
  adjust(item: FallbackPayoutNotice, value: number): number;
}

export class UtmSourceFallbackPayoutNoticeAdjuster implements FallbackPayoutNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FallbackPayoutNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackPayoutNoticeBatchSizeOffsetAdjuster implements FallbackPayoutNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: FallbackPayoutNotice, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredFallbackPayoutNoticeAdjuster implements FallbackPayoutNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPayoutNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackPayoutNoticeAdjuster implements FallbackPayoutNoticeModifier {
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

  adjust(item: FallbackPayoutNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback payout notice steps in order and keeps a trace of each. */
export class FallbackPayoutNoticeEngine {
  steps: FallbackPayoutNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPayoutNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPayoutNotice): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackPayoutNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPayoutNoticeEngine(flagsValue: flags.Registry): FallbackPayoutNoticeEngine {
  return new FallbackPayoutNoticeEngine(
    [
      new UtmSourceFallbackPayoutNoticeAdjuster(new Map<string, number>([["central", 1.13], ["retail", 1.12]])),
      new FallbackPayoutNoticeBatchSizeOffsetAdjuster(0.18),
      new TieredFallbackPayoutNoticeAdjuster([53, 509, 6996], [0.94, 0.88, 1.03]),
      new FlaggedFallbackPayoutNoticeAdjuster(flagsValue, "fallback-payout-notice-default", -5.1),
    ],
    [],
    3,
    21475.9,
  );
}
