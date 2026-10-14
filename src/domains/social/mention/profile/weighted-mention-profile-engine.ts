import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedMentionProfile } from "./weighted-mention-profile.js";

/** One step of the weighted mention profile calculation. */
export interface WeightedMentionProfileFactor {
  describe(): string;
  adjust(item: WeightedMentionProfile, value: number): number;
}

export class WeightedMentionProfileScoreOffsetAdjuster implements WeightedMentionProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WeightedMentionProfile, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TitleWeightedMentionProfileAdjuster implements WeightedMentionProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedMentionProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedMentionProfileAdjuster implements WeightedMentionProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedMentionProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedMentionProfileAdjuster implements WeightedMentionProfileFactor {
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

  adjust(item: WeightedMentionProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted mention profile steps in order and keeps a trace of each. */
export class WeightedMentionProfileEngine {
  steps: WeightedMentionProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedMentionProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedMentionProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedMentionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedMentionProfileEngine(flagsValue: flags.Registry): WeightedMentionProfileEngine {
  return new WeightedMentionProfileEngine(
    [
      new WeightedMentionProfileScoreOffsetAdjuster(1.92),
      new TitleWeightedMentionProfileAdjuster(new Map<string, number>([["online", 1.16], ["central", 0.93]])),
      new RoundingWeightedMentionProfileAdjuster(5),
      new FlaggedWeightedMentionProfileAdjuster(flagsValue, "weighted-mention-profile-seasonal", -0.2),
    ],
    [],
    4.9,
    17321.1,
  );
}
