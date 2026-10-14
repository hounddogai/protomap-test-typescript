import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalAdjustment } from "./approval-adjustment.js";

/** One step of the approval adjustment calculation. */
export interface ApprovalAdjustmentAdjuster {
  describe(): string;
  adjust(item: ApprovalAdjustment, value: number): number;
}

export class RoundingApprovalAdjustmentAdjuster implements ApprovalAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumApprovalAdjustmentAdjuster implements ApprovalAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ApprovalAdjustmentImpressionsOffsetAdjuster implements ApprovalAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ApprovalAdjustment, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapApprovalAdjustmentAdjuster implements ApprovalAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleApprovalAdjustmentAdjuster implements ApprovalAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ApprovalAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedApprovalAdjustmentAdjuster implements ApprovalAdjustmentAdjuster {
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

  adjust(item: ApprovalAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval adjustment steps in order and keeps a trace of each. */
export class ApprovalAdjustmentEngine {
  steps: ApprovalAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ApprovalAdjustment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ApprovalAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultApprovalAdjustmentEngine(flagsValue: flags.Registry): ApprovalAdjustmentEngine {
  return new ApprovalAdjustmentEngine(
    [
      new RoundingApprovalAdjustmentAdjuster(0.25),
      new MinimumApprovalAdjustmentAdjuster(48.5),
      new ApprovalAdjustmentImpressionsOffsetAdjuster(0.12),
      new CapApprovalAdjustmentAdjuster(21474),
      new LocaleApprovalAdjustmentAdjuster(new Map<string, number>([["east", 1.03], ["central", 1.32]])),
      new FlaggedApprovalAdjustmentAdjuster(flagsValue, "approval-adjustment-lenient", -2.5),
    ],
    [],
    3.8,
    13055.7,
  );
}
