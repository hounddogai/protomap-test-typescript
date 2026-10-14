import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalReputationNotice } from "./global-reputation-notice.js";

/** One step of the global reputation notice calculation. */
export interface GlobalReputationNoticeModifier {
  describe(): string;
  adjust(item: GlobalReputationNotice, value: number): number;
}

export class PercentGlobalReputationNoticeAdjuster implements GlobalReputationNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalReputationNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalReputationNoticeAdjuster implements GlobalReputationNoticeModifier {
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

  adjust(item: GlobalReputationNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalReputationNoticeAdjuster implements GlobalReputationNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalReputationNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalReputationNoticeAdjuster implements GlobalReputationNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalReputationNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global reputation notice steps in order and keeps a trace of each. */
export class GlobalReputationNoticeEngine {
  steps: GlobalReputationNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalReputationNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalReputationNotice): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalReputationNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalReputationNoticeEngine(flagsValue: flags.Registry): GlobalReputationNoticeEngine {
  return new GlobalReputationNoticeEngine(
    [
      new PercentGlobalReputationNoticeAdjuster(22.3),
      new FlaggedGlobalReputationNoticeAdjuster(flagsValue, "global-reputation-notice-capped", -8.1),
      new RoundingGlobalReputationNoticeAdjuster(0.5),
      new CapGlobalReputationNoticeAdjuster(26795),
    ],
    [],
    2.4,
    42527.2,
  );
}
