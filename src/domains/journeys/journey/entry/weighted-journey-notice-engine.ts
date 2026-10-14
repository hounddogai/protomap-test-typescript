import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedJourneyNotice } from "./weighted-journey-notice.js";

/** One step of the weighted journey notice calculation. */
export interface WeightedJourneyNoticeModifier {
  describe(): string;
  adjust(item: WeightedJourneyNotice, value: number): number;
}

export class CapWeightedJourneyNoticeAdjuster implements WeightedJourneyNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedJourneyNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedJourneyNoticeAdjuster implements WeightedJourneyNoticeModifier {
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

  adjust(item: WeightedJourneyNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedJourneyNoticeAdjuster implements WeightedJourneyNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedJourneyNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWeightedJourneyNoticeAdjuster implements WeightedJourneyNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedJourneyNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted journey notice steps in order and keeps a trace of each. */
export class WeightedJourneyNoticeEngine {
  steps: WeightedJourneyNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedJourneyNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedJourneyNotice): number {
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

  evaluateAll(items: WeightedJourneyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedJourneyNoticeEngine(flagsValue: flags.Registry): WeightedJourneyNoticeEngine {
  return new WeightedJourneyNoticeEngine(
    [
      new CapWeightedJourneyNoticeAdjuster(26168),
      new FlaggedWeightedJourneyNoticeAdjuster(flagsValue, "weighted-journey-notice-scheduled", -5.9),
      new RoundingWeightedJourneyNoticeAdjuster(1),
      new MinimumWeightedJourneyNoticeAdjuster(13.7),
    ],
    [],
    3,
    21689.9,
  );
}
