import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualReplyMetric } from "./manual-reply-metric.js";

/** One step of the manual reply metric calculation. */
export interface ManualReplyMetricStep {
  describe(): string;
  adjust(item: ManualReplyMetric, value: number): number;
}

export class FlaggedManualReplyMetricAdjuster implements ManualReplyMetricStep {
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

  adjust(item: ManualReplyMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualReplyMetricAdjuster implements ManualReplyMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualReplyMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualReplyMetricAdjuster implements ManualReplyMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualReplyMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual reply metric steps in order and keeps a trace of each. */
export class ManualReplyMetricEngine {
  steps: ManualReplyMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualReplyMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualReplyMetric): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ManualReplyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualReplyMetricEngine(flagsValue: flags.Registry): ManualReplyMetricEngine {
  return new ManualReplyMetricEngine(
    [
      new FlaggedManualReplyMetricAdjuster(flagsValue, "manual-reply-metric-rolling", 7),
      new CapManualReplyMetricAdjuster(7230),
      new MinimumManualReplyMetricAdjuster(3.7),
    ],
    [],
    2.8,
    49387.7,
  );
}
