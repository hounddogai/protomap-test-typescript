import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientMentionSegment } from "./lenient-mention-segment.js";

/** One step of the lenient mention segment calculation. */
export interface LenientMentionSegmentStep {
  describe(): string;
  adjust(item: LenientMentionSegment, value: number): number;
}

export class RoundingLenientMentionSegmentAdjuster implements LenientMentionSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientMentionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientMentionSegmentAdjuster implements LenientMentionSegmentStep {
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

  adjust(item: LenientMentionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionLenientMentionSegmentAdjuster implements LenientMentionSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LenientMentionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientMentionSegmentAdjuster implements LenientMentionSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientMentionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientMentionSegmentAdjuster implements LenientMentionSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientMentionSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient mention segment steps in order and keeps a trace of each. */
export class LenientMentionSegmentEngine {
  steps: LenientMentionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientMentionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientMentionSegment): number {
    let current = item.netVolume();
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

  evaluateAll(items: LenientMentionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientMentionSegmentEngine(flagsValue: flags.Registry): LenientMentionSegmentEngine {
  return new LenientMentionSegmentEngine(
    [
      new RoundingLenientMentionSegmentAdjuster(0.05),
      new FlaggedLenientMentionSegmentAdjuster(flagsValue, "lenient-mention-segment-scheduled", 6.8),
      new RegionLenientMentionSegmentAdjuster(
        new Map<string, number>([["west", 1.36], ["east", 0.82], ["online", 0.96]]),
      ),
      new PercentLenientMentionSegmentAdjuster(4.1),
      new MinimumLenientMentionSegmentAdjuster(48),
    ],
    [],
    4.2,
    5869,
  );
}
