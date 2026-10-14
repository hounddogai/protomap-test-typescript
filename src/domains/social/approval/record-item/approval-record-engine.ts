import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalRecord } from "./approval-record.js";

/** One step of the approval record calculation. */
export interface ApprovalRecordAdjuster {
  describe(): string;
  adjust(item: ApprovalRecord, value: number): number;
}

export class PercentApprovalRecordAdjuster implements ApprovalRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingApprovalRecordAdjuster implements ApprovalRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedApprovalRecordAdjuster implements ApprovalRecordAdjuster {
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

  adjust(item: ApprovalRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapApprovalRecordAdjuster implements ApprovalRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumApprovalRecordAdjuster implements ApprovalRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the approval record steps in order and keeps a trace of each. */
export class ApprovalRecordEngine {
  steps: ApprovalRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalRecord): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ApprovalRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalRecordEngine(flagsValue: flags.Registry): ApprovalRecordEngine {
  return new ApprovalRecordEngine(
    [
      new PercentApprovalRecordAdjuster(-8.1),
      new RoundingApprovalRecordAdjuster(1),
      new FlaggedApprovalRecordAdjuster(flagsValue, "approval-record-primary", 9.8),
      new CapApprovalRecordAdjuster(12711),
      new MinimumApprovalRecordAdjuster(18.7),
    ],
    [],
    1.3,
    1343.7,
  );
}
