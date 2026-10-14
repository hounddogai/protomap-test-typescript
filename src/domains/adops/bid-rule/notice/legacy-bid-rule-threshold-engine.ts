import * as flags from "../../../../kit/flags.js";
import { LegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

/** One step of the legacy bid rule threshold calculation. */
export interface LegacyBidRuleThresholdModifier {
  describe(): string;
  adjust(item: LegacyBidRuleThreshold, value: number): number;
}

export class LegacyBidRuleThresholdGraceDaysOffsetAdjuster implements LegacyBidRuleThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: LegacyBidRuleThreshold, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumLegacyBidRuleThresholdAdjuster implements LegacyBidRuleThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyBidRuleThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacyBidRuleThresholdAdjuster implements LegacyBidRuleThresholdModifier {
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

  adjust(item: LegacyBidRuleThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryLegacyBidRuleThresholdAdjuster implements LegacyBidRuleThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyBidRuleThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy bid rule threshold steps in order and keeps a trace of each. */
export class LegacyBidRuleThresholdEngine {
  steps: LegacyBidRuleThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBidRuleThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyBidRuleThreshold): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LegacyBidRuleThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyBidRuleThresholdEngine(flagsValue: flags.Registry): LegacyBidRuleThresholdEngine {
  return new LegacyBidRuleThresholdEngine(
    [
      new LegacyBidRuleThresholdGraceDaysOffsetAdjuster(1.71),
      new MinimumLegacyBidRuleThresholdAdjuster(28.8),
      new FlaggedLegacyBidRuleThresholdAdjuster(flagsValue, "legacy-bid-rule-threshold-scheduled", 4.8),
      new CountryLegacyBidRuleThresholdAdjuster(
        new Map<string, number>([["online", 0.8], ["south", 0.97], ["retail", 1.1]]),
      ),
    ],
    [],
    0.9,
    90798.9,
  );
}
