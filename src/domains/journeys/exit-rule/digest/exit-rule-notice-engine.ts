import * as flags from "../../../../kit/flags.js";
import { ExitRuleNotice } from "./exit-rule-notice.js";

/** One step of the exit rule notice calculation. */
export interface ExitRuleNoticeStep {
  describe(): string;
  adjust(item: ExitRuleNotice, value: number): number;
}

export class ChannelExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ExitRuleNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
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

  adjust(item: ExitRuleNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentExitRuleNoticeAdjuster implements ExitRuleNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule notice steps in order and keeps a trace of each. */
export class ExitRuleNoticeEngine {
  steps: ExitRuleNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleNotice): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ExitRuleNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleNoticeEngine(flagsValue: flags.Registry): ExitRuleNoticeEngine {
  return new ExitRuleNoticeEngine(
    [
      new ChannelExitRuleNoticeAdjuster(new Map<string, number>([["retail", 0.76], ["online", 1.18]])),
      new TieredExitRuleNoticeAdjuster([821, 967, 3746], [1.06, 0.84, 1.02]),
      new CapExitRuleNoticeAdjuster(2313),
      new FlaggedExitRuleNoticeAdjuster(flagsValue, "exit-rule-notice-regional", 8.1),
      new MinimumExitRuleNoticeAdjuster(20.9),
      new PercentExitRuleNoticeAdjuster(-21.2),
    ],
    [],
    2.4,
    40550.2,
  );
}
