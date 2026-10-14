import * as flags from "../../../../kit/flags.js";
import { TieredReplyPreference } from "./tiered-reply-preference.js";

/** One step of the tiered reply preference calculation. */
export interface TieredReplyPreferenceFactor {
  describe(): string;
  adjust(item: TieredReplyPreference, value: number): number;
}

export class FlaggedTieredReplyPreferenceAdjuster implements TieredReplyPreferenceFactor {
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

  adjust(item: TieredReplyPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplyPreferenceThresholdOffsetAdjuster implements TieredReplyPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: TieredReplyPreference, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class UnitTieredReplyPreferenceAdjuster implements TieredReplyPreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredReplyPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered reply preference steps in order and keeps a trace of each. */
export class TieredReplyPreferenceEngine {
  steps: TieredReplyPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredReplyPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredReplyPreference): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TieredReplyPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredReplyPreferenceEngine(flagsValue: flags.Registry): TieredReplyPreferenceEngine {
  return new TieredReplyPreferenceEngine(
    [
      new FlaggedTieredReplyPreferenceAdjuster(flagsValue, "tiered-reply-preference-fallback", 1.4),
      new TieredReplyPreferenceThresholdOffsetAdjuster(1.54),
      new UnitTieredReplyPreferenceAdjuster(new Map<string, number>([["west", 1.28], ["central", 1.3]])),
    ],
    [],
    0.7,
    57046.9,
  );
}
