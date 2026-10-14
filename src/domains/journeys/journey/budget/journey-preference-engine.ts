import * as flags from "../../../../kit/flags.js";
import { JourneyPreference } from "./journey-preference.js";

/** One step of the journey preference calculation. */
export interface JourneyPreferenceModifier {
  describe(): string;
  adjust(item: JourneyPreference, value: number): number;
}

export class RegionJourneyPreferenceAdjuster implements JourneyPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: JourneyPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentJourneyPreferenceAdjuster implements JourneyPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedJourneyPreferenceAdjuster implements JourneyPreferenceModifier {
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

  adjust(item: JourneyPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey preference steps in order and keeps a trace of each. */
export class JourneyPreferenceEngine {
  steps: JourneyPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyPreference): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: JourneyPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyPreferenceEngine(flagsValue: flags.Registry): JourneyPreferenceEngine {
  return new JourneyPreferenceEngine(
    [
      new RegionJourneyPreferenceAdjuster(new Map<string, number>([["north", 0.95], ["west", 0.73]])),
      new PercentJourneyPreferenceAdjuster(-24.7),
      new FlaggedJourneyPreferenceAdjuster(flagsValue, "journey-preference-primary", 5.4),
    ],
    [],
    4.9,
    20523.1,
  );
}
