import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionEstimate } from "./mention-estimate.js";

/** One step of the mention estimate calculation. */
export interface MentionEstimateFactor {
  describe(): string;
  adjust(item: MentionEstimate, value: number): number;
}

export class FlaggedMentionEstimateAdjuster implements MentionEstimateFactor {
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

  adjust(item: MentionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingMentionEstimateAdjuster implements MentionEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MentionEstimateEndsAtOffsetAdjuster implements MentionEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: MentionEstimate, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TitleMentionEstimateAdjuster implements MentionEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: MentionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentMentionEstimateAdjuster implements MentionEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention estimate steps in order and keeps a trace of each. */
export class MentionEstimateEngine {
  steps: MentionEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionEstimate): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: MentionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionEstimateEngine(flagsValue: flags.Registry): MentionEstimateEngine {
  return new MentionEstimateEngine(
    [
      new FlaggedMentionEstimateAdjuster(flagsValue, "mention-estimate-tiered", 8.7),
      new RoundingMentionEstimateAdjuster(0.1),
      new MentionEstimateEndsAtOffsetAdjuster(0.14),
      new TitleMentionEstimateAdjuster(new Map<string, number>([["south", 1.15]])),
      new PercentMentionEstimateAdjuster(-13.6),
    ],
    [],
    1.2,
    62763.9,
  );
}
