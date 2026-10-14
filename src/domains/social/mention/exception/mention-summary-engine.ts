import * as flags from "../../../../kit/flags.js";
import { MentionSummary } from "./mention-summary.js";

/** One step of the mention summary calculation. */
export interface MentionSummaryAdjuster {
  describe(): string;
  adjust(item: MentionSummary, value: number): number;
}

export class FlaggedMentionSummaryAdjuster implements MentionSummaryAdjuster {
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

  adjust(item: MentionSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMentionSummaryAdjuster implements MentionSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumMentionSummaryAdjuster implements MentionSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapMentionSummaryAdjuster implements MentionSummaryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the mention summary steps in order and keeps a trace of each. */
export class MentionSummaryEngine {
  steps: MentionSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: MentionSummary): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: MentionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultMentionSummaryEngine(flagsValue: flags.Registry): MentionSummaryEngine {
  return new MentionSummaryEngine(
    [
      new FlaggedMentionSummaryAdjuster(flagsValue, "mention-summary-global", 0.1),
      new PercentMentionSummaryAdjuster(20.2),
      new MinimumMentionSummaryAdjuster(43.4),
      new CapMentionSummaryAdjuster(6877),
    ],
    [],
    0.2,
    73618.3,
  );
}
