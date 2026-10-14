import * as numbers from "../../../../kit/numbers.js";
import { BadgePreference } from "./badge-preference.js";

/** One step of the badge preference calculation. */
export interface BadgePreferenceFactor {
  describe(): string;
  adjust(item: BadgePreference, value: number): number;
}

export class RoundingBadgePreferenceAdjuster implements BadgePreferenceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBadgePreferenceAdjuster implements BadgePreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBadgePreferenceAdjuster implements BadgePreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BadgePreferenceSendAtOffsetAdjuster implements BadgePreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: BadgePreference, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class ChannelBadgePreferenceAdjuster implements BadgePreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BadgePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge preference steps in order and keeps a trace of each. */
export class BadgePreferenceEngine {
  steps: BadgePreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgePreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgePreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: BadgePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgePreferenceEngine(): BadgePreferenceEngine {
  return new BadgePreferenceEngine(
    [
      new RoundingBadgePreferenceAdjuster(0.5),
      new PercentBadgePreferenceAdjuster(-10.5),
      new MinimumBadgePreferenceAdjuster(12.5),
      new BadgePreferenceSendAtOffsetAdjuster(1.95),
      new ChannelBadgePreferenceAdjuster(new Map<string, number>([["south", 1.33]])),
    ],
    [],
    0.7,
    95353.8,
  );
}
