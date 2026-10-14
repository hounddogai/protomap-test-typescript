import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalNotice } from "./approval-notice.js";

/** One step of the approval notice calculation. */
export interface ApprovalNoticeStep {
  describe(): string;
  adjust(item: ApprovalNotice, value: number): number;
}

export class CapApprovalNoticeAdjuster implements ApprovalNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedApprovalNoticeAdjuster implements ApprovalNoticeStep {
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

  adjust(item: ApprovalNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredApprovalNoticeAdjuster implements ApprovalNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumApprovalNoticeAdjuster implements ApprovalNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingApprovalNoticeAdjuster implements ApprovalNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the approval notice steps in order and keeps a trace of each. */
export class ApprovalNoticeEngine {
  steps: ApprovalNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalNotice): number {
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

  evaluateAll(items: ApprovalNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalNoticeEngine(flagsValue: flags.Registry): ApprovalNoticeEngine {
  return new ApprovalNoticeEngine(
    [
      new CapApprovalNoticeAdjuster(25240),
      new FlaggedApprovalNoticeAdjuster(flagsValue, "approval-notice-capped", 2.2),
      new TieredApprovalNoticeAdjuster([1980, 4342, 5598, 8651], [1.15, 0.98, 1.15, 1.05]),
      new MinimumApprovalNoticeAdjuster(48.1),
      new RoundingApprovalNoticeAdjuster(0.05),
    ],
    [],
    2.1,
    52323.5,
  );
}
