import * as flags from "../../../../kit/flags.js";
import { QueueMetric } from "./queue-metric.js";

/** One step of the queue metric calculation. */
export interface QueueMetricModifier {
  describe(): string;
  adjust(item: QueueMetric, value: number): number;
}

export class MinimumQueueMetricAdjuster implements QueueMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameQueueMetricAdjuster implements QueueMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: QueueMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class QueueMetricPriorityOffsetAdjuster implements QueueMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: QueueMetric, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapQueueMetricAdjuster implements QueueMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredQueueMetricAdjuster implements QueueMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedQueueMetricAdjuster implements QueueMetricModifier {
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

  adjust(item: QueueMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue metric steps in order and keeps a trace of each. */
export class QueueMetricEngine {
  steps: QueueMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueMetric): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: QueueMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueMetricEngine(flagsValue: flags.Registry): QueueMetricEngine {
  return new QueueMetricEngine(
    [
      new MinimumQueueMetricAdjuster(0),
      new NameQueueMetricAdjuster(new Map<string, number>([["retail", 1.31], ["north", 1.31]])),
      new QueueMetricPriorityOffsetAdjuster(1.86),
      new CapQueueMetricAdjuster(47368),
      new TieredQueueMetricAdjuster([1563, 4666, 5630], [0.97, 1.09, 1.03]),
      new FlaggedQueueMetricAdjuster(flagsValue, "queue-metric-rolling", 6.8),
    ],
    [],
    1.3,
    11852.7,
  );
}
