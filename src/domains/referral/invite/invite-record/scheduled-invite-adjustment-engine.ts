import * as flags from "../../../../kit/flags.js";
import { ScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

/** One step of the scheduled invite adjustment calculation. */
export interface ScheduledInviteAdjustmentModifier {
  describe(): string;
  adjust(item: ScheduledInviteAdjustment, value: number): number;
}

export class PercentScheduledInviteAdjustmentAdjuster implements ScheduledInviteAdjustmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledInviteAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledInviteAdjustmentAdjuster implements ScheduledInviteAdjustmentModifier {
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

  adjust(item: ScheduledInviteAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledInviteAdjustmentAdjuster implements ScheduledInviteAdjustmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledInviteAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledInviteAdjustmentAdjuster implements ScheduledInviteAdjustmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledInviteAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled invite adjustment steps in order and keeps a trace of each. */
export class ScheduledInviteAdjustmentEngine {
  steps: ScheduledInviteAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledInviteAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledInviteAdjustment): number {
    let current = item.netTotal();
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

  evaluateAll(items: ScheduledInviteAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledInviteAdjustmentEngine(flagsValue: flags.Registry): ScheduledInviteAdjustmentEngine {
  return new ScheduledInviteAdjustmentEngine(
    [
      new PercentScheduledInviteAdjustmentAdjuster(-20.9),
      new FlaggedScheduledInviteAdjustmentAdjuster(flagsValue, "scheduled-invite-adjustment-rolling", -7.8),
      new MinimumScheduledInviteAdjustmentAdjuster(1.4),
      new CapScheduledInviteAdjustmentAdjuster(16729),
    ],
    [],
    3.4,
    13440.6,
  );
}
