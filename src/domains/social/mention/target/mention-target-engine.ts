import * as flags from "../../../../kit/flags.js";
import { MentionTarget } from "./mention-target.js";

/** One step of the mention target calculation. */
export interface MentionTargetFactor {
  describe(): string;
  adjust(item: MentionTarget, value: number): number;
}

export class MinimumMentionTargetAdjuster implements MentionTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedMentionTargetAdjuster implements MentionTargetFactor {
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

  adjust(item: MentionTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapMentionTargetAdjuster implements MentionTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention target steps in order and keeps a trace of each. */
export class MentionTargetEngine {
  steps: MentionTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionTarget): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: MentionTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionTargetEngine(flagsValue: flags.Registry): MentionTargetEngine {
  return new MentionTargetEngine(
    [
      new MinimumMentionTargetAdjuster(20.2),
      new FlaggedMentionTargetAdjuster(flagsValue, "mention-target-strict", -0.9),
      new CapMentionTargetAdjuster(2344),
    ],
    [],
    4.9,
    99929.9,
  );
}
