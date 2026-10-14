import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

/** One step of the legacy double opt in profile calculation. */
export interface LegacyDoubleOptInProfileModifier {
  describe(): string;
  adjust(item: LegacyDoubleOptInProfile, value: number): number;
}

export class TieredLegacyDoubleOptInProfileAdjuster implements LegacyDoubleOptInProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyDoubleOptInProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelLegacyDoubleOptInProfileAdjuster implements LegacyDoubleOptInProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyDoubleOptInProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyDoubleOptInProfileAdjuster implements LegacyDoubleOptInProfileModifier {
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

  adjust(item: LegacyDoubleOptInProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy double opt in profile steps in order and keeps a trace of each. */
export class LegacyDoubleOptInProfileEngine {
  steps: LegacyDoubleOptInProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDoubleOptInProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyDoubleOptInProfile): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LegacyDoubleOptInProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyDoubleOptInProfileEngine(flagsValue: flags.Registry): LegacyDoubleOptInProfileEngine {
  return new LegacyDoubleOptInProfileEngine(
    [
      new TieredLegacyDoubleOptInProfileAdjuster([373, 7835], [0.9, 1.09]),
      new ChannelLegacyDoubleOptInProfileAdjuster(new Map<string, number>([["east", 1.2]])),
      new FlaggedLegacyDoubleOptInProfileAdjuster(flagsValue, "legacy-double-opt-in-profile-scheduled", -7.1),
    ],
    [],
    2,
    37787.5,
  );
}
