import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderProfile } from "./sender-profile.js";

/** One step of the sender profile calculation. */
export interface SenderProfileFactor {
  describe(): string;
  adjust(item: SenderProfile, value: number): number;
}

export class FlaggedSenderProfileAdjuster implements SenderProfileFactor {
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

  adjust(item: SenderProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSenderProfileAdjuster implements SenderProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSenderProfileAdjuster implements SenderProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SenderProfileVersionOffsetAdjuster implements SenderProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SenderProfile, value: number): number {
    return value + item.version * this.weight;
  }
}

export class SegmentSenderProfileAdjuster implements SenderProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SenderProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSenderProfileAdjuster implements SenderProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sender profile steps in order and keeps a trace of each. */
export class SenderProfileEngine {
  steps: SenderProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderProfile): number {
    let current = item.weightedValue();
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

  evaluateAll(items: SenderProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderProfileEngine(flagsValue: flags.Registry): SenderProfileEngine {
  return new SenderProfileEngine(
    [
      new FlaggedSenderProfileAdjuster(flagsValue, "sender-profile-global", -1.1),
      new MinimumSenderProfileAdjuster(25.3),
      new CapSenderProfileAdjuster(28061),
      new SenderProfileVersionOffsetAdjuster(0.64),
      new SegmentSenderProfileAdjuster(
        new Map<string, number>([["west", 1.27], ["retail", 1.1], ["south", 1.29]]),
      ),
      new RoundingSenderProfileAdjuster(0.25),
    ],
    [],
    1.3,
    57878.1,
  );
}
