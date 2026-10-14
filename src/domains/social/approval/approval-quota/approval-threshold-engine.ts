import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalThreshold } from "./approval-threshold.js";

/** One step of the approval threshold calculation. */
export interface ApprovalThresholdStep {
  describe(): string;
  adjust(item: ApprovalThreshold, value: number): number;
}

export class ChannelApprovalThresholdAdjuster implements ApprovalThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ApprovalThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ApprovalThresholdGraceDaysOffsetAdjuster implements ApprovalThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ApprovalThreshold, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class FlaggedApprovalThresholdAdjuster implements ApprovalThresholdStep {
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

  adjust(item: ApprovalThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumApprovalThresholdAdjuster implements ApprovalThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentApprovalThresholdAdjuster implements ApprovalThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingApprovalThresholdAdjuster implements ApprovalThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the approval threshold steps in order and keeps a trace of each. */
export class ApprovalThresholdEngine {
  steps: ApprovalThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalThreshold): number {
    let current = item.netVolume();
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

  evaluateAll(items: ApprovalThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalThresholdEngine(flagsValue: flags.Registry): ApprovalThresholdEngine {
  return new ApprovalThresholdEngine(
    [
      new ChannelApprovalThresholdAdjuster(new Map<string, number>([["online", 1.05], ["north", 0.78]])),
      new ApprovalThresholdGraceDaysOffsetAdjuster(1.81),
      new FlaggedApprovalThresholdAdjuster(flagsValue, "approval-threshold-pending", 5.2),
      new MinimumApprovalThresholdAdjuster(48.8),
      new PercentApprovalThresholdAdjuster(-8.5),
      new RoundingApprovalThresholdAdjuster(0.25),
    ],
    [],
    0.5,
    57060.1,
  );
}
