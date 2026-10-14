import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredReplyProfile } from "./tiered-reply-profile.js";

/** One step of the tiered reply profile calculation. */
export interface TieredReplyProfileStep {
  describe(): string;
  adjust(item: TieredReplyProfile, value: number): number;
}

export class TieredReplyProfileFrequencyCapOffsetAdjuster implements TieredReplyProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: TieredReplyProfile, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RoundingTieredReplyProfileAdjuster implements TieredReplyProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredReplyProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredReplyProfileAdjuster implements TieredReplyProfileStep {
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

  adjust(item: TieredReplyProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredReplyProfileAdjuster implements TieredReplyProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredReplyProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered reply profile steps in order and keeps a trace of each. */
export class TieredReplyProfileEngine {
  steps: TieredReplyProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredReplyProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredReplyProfile): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TieredReplyProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredReplyProfileEngine(flagsValue: flags.Registry): TieredReplyProfileEngine {
  return new TieredReplyProfileEngine(
    [
      new TieredReplyProfileFrequencyCapOffsetAdjuster(0.44),
      new RoundingTieredReplyProfileAdjuster(1),
      new FlaggedTieredReplyProfileAdjuster(flagsValue, "tiered-reply-profile-rolling", -8),
      new CapTieredReplyProfileAdjuster(34284),
    ],
    [],
    3.1,
    79730.6,
  );
}
