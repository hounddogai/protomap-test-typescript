import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackInvitePreference } from "./fallback-invite-preference.js";

/** One step of the fallback invite preference calculation. */
export interface FallbackInvitePreferenceModifier {
  describe(): string;
  adjust(item: FallbackInvitePreference, value: number): number;
}

export class MinimumFallbackInvitePreferenceAdjuster implements FallbackInvitePreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackInvitePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackInvitePreferenceAdjuster implements FallbackInvitePreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackInvitePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFallbackInvitePreferenceAdjuster implements FallbackInvitePreferenceModifier {
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

  adjust(item: FallbackInvitePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentFallbackInvitePreferenceAdjuster implements FallbackInvitePreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: FallbackInvitePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback invite preference steps in order and keeps a trace of each. */
export class FallbackInvitePreferenceEngine {
  steps: FallbackInvitePreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInvitePreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackInvitePreference): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackInvitePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackInvitePreferenceEngine(flagsValue: flags.Registry): FallbackInvitePreferenceEngine {
  return new FallbackInvitePreferenceEngine(
    [
      new MinimumFallbackInvitePreferenceAdjuster(2.2),
      new RoundingFallbackInvitePreferenceAdjuster(0.1),
      new FlaggedFallbackInvitePreferenceAdjuster(flagsValue, "fallback-invite-preference-global", 0.9),
      new SegmentFallbackInvitePreferenceAdjuster(new Map<string, number>([["central", 0.76]])),
    ],
    [],
    3.3,
    8783.3,
  );
}
