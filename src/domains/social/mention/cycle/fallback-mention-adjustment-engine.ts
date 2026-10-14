import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

/** One step of the fallback mention adjustment calculation. */
export interface FallbackMentionAdjustmentAdjuster {
  describe(): string;
  adjust(item: FallbackMentionAdjustment, value: number): number;
}

export class CapFallbackMentionAdjustmentAdjuster implements FallbackMentionAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackMentionAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelFallbackMentionAdjustmentAdjuster implements FallbackMentionAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackMentionAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFallbackMentionAdjustmentAdjuster implements FallbackMentionAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackMentionAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackMentionAdjustmentRevisionOffsetAdjuster implements FallbackMentionAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: FallbackMentionAdjustment, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedFallbackMentionAdjustmentAdjuster implements FallbackMentionAdjustmentAdjuster {
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

  adjust(item: FallbackMentionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackMentionAdjustmentAdjuster implements FallbackMentionAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackMentionAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback mention adjustment steps in order and keeps a trace of each. */
export class FallbackMentionAdjustmentEngine {
  steps: FallbackMentionAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackMentionAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackMentionAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackMentionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackMentionAdjustmentEngine(flagsValue: flags.Registry): FallbackMentionAdjustmentEngine {
  return new FallbackMentionAdjustmentEngine(
    [
      new CapFallbackMentionAdjustmentAdjuster(40865),
      new LabelFallbackMentionAdjustmentAdjuster(
        new Map<string, number>([["east", 1.35], ["west", 1.08], ["central", 1.29]]),
      ),
      new PercentFallbackMentionAdjustmentAdjuster(6.9),
      new FallbackMentionAdjustmentRevisionOffsetAdjuster(1.89),
      new FlaggedFallbackMentionAdjustmentAdjuster(flagsValue, "fallback-mention-adjustment-pending", -1.6),
      new MinimumFallbackMentionAdjustmentAdjuster(40.8),
    ],
    [],
    3.8,
    76655.1,
  );
}
