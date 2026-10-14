import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionThreshold } from "./mention-threshold.js";

/** One step of the mention threshold calculation. */
export interface MentionThresholdStep {
  describe(): string;
  adjust(item: MentionThreshold, value: number): number;
}

export class RoundingMentionThresholdAdjuster implements MentionThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelMentionThresholdAdjuster implements MentionThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: MentionThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapMentionThresholdAdjuster implements MentionThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedMentionThresholdAdjuster implements MentionThresholdStep {
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

  adjust(item: MentionThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMentionThresholdAdjuster implements MentionThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredMentionThresholdAdjuster implements MentionThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MentionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the mention threshold steps in order and keeps a trace of each. */
export class MentionThresholdEngine {
  steps: MentionThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionThreshold): number {
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

  evaluateAll(items: MentionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionThresholdEngine(flagsValue: flags.Registry): MentionThresholdEngine {
  return new MentionThresholdEngine(
    [
      new RoundingMentionThresholdAdjuster(5),
      new ChannelMentionThresholdAdjuster(new Map<string, number>([["south", 1.2]])),
      new CapMentionThresholdAdjuster(48180),
      new FlaggedMentionThresholdAdjuster(flagsValue, "mention-threshold-manual", 1.8),
      new PercentMentionThresholdAdjuster(-16.4),
      new TieredMentionThresholdAdjuster([3898, 4299, 7195], [1.07, 0.95, 1.19]),
    ],
    [],
    1.5,
    98003.7,
  );
}
