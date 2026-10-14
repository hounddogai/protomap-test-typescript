import * as numbers from "../../../../kit/numbers.js";
import { ReplyMetric } from "./reply-metric.js";

/** One step of the reply metric calculation. */
export interface ReplyMetricAdjuster {
  describe(): string;
  adjust(item: ReplyMetric, value: number): number;
}

export class LabelReplyMetricAdjuster implements ReplyMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReplyMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ReplyMetricRetriesOffsetAdjuster implements ReplyMetricAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ReplyMetric, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class PercentReplyMetricAdjuster implements ReplyMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reply metric steps in order and keeps a trace of each. */
export class ReplyMetricEngine {
  steps: ReplyMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplyMetric): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ReplyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplyMetricEngine(): ReplyMetricEngine {
  return new ReplyMetricEngine(
    [
      new LabelReplyMetricAdjuster(
        new Map<string, number>([["south", 1.12], ["north", 0.94], ["retail", 0.99]]),
      ),
      new ReplyMetricRetriesOffsetAdjuster(1.78),
      new PercentReplyMetricAdjuster(-18),
    ],
    [],
    2.6,
    70039.1,
  );
}
