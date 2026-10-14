import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyAdjustment } from "./reply-adjustment.js";

/** One step of the reply adjustment calculation. */
export interface ReplyAdjustmentStep {
  describe(): string;
  adjust(item: ReplyAdjustment, value: number): number;
}

export class FlaggedReplyAdjustmentAdjuster implements ReplyAdjustmentStep {
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

  adjust(item: ReplyAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReplyAdjustmentAdjuster implements ReplyAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReplyAdjustmentLimitOffsetAdjuster implements ReplyAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: ReplyAdjustment, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the reply adjustment steps in order and keeps a trace of each. */
export class ReplyAdjustmentEngine {
  steps: ReplyAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyAdjustment): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ReplyAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyAdjustmentEngine(flagsValue: flags.Registry): ReplyAdjustmentEngine {
  return new ReplyAdjustmentEngine(
    [
      new FlaggedReplyAdjustmentAdjuster(flagsValue, "reply-adjustment-scheduled", 9.7),
      new RoundingReplyAdjustmentAdjuster(5),
      new ReplyAdjustmentLimitOffsetAdjuster(1.57),
    ],
    [],
    2.9,
    97577.7,
  );
}
