import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingInsightMetric } from "./pending-insight-metric.js";

/** One step of the pending insight metric calculation. */
export interface PendingInsightMetricStep {
  describe(): string;
  adjust(item: PendingInsightMetric, value: number): number;
}

export class FlaggedPendingInsightMetricAdjuster implements PendingInsightMetricStep {
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

  adjust(item: PendingInsightMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingInsightMetricAdjuster implements PendingInsightMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingInsightMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePendingInsightMetricAdjuster implements PendingInsightMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingInsightMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingInsightMetricAdjuster implements PendingInsightMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInsightMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingInsightMetricAdjuster implements PendingInsightMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingInsightMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending insight metric steps in order and keeps a trace of each. */
export class PendingInsightMetricEngine {
  steps: PendingInsightMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInsightMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingInsightMetric): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingInsightMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingInsightMetricEngine(flagsValue: flags.Registry): PendingInsightMetricEngine {
  return new PendingInsightMetricEngine(
    [
      new FlaggedPendingInsightMetricAdjuster(flagsValue, "pending-insight-metric-manual", 8.4),
      new TieredPendingInsightMetricAdjuster([5391, 5725, 8986, 9927], [0.92, 0.95, 1.01, 0.9]),
      new NamePendingInsightMetricAdjuster(new Map<string, number>([["online", 1.29]])),
      new CapPendingInsightMetricAdjuster(15327),
      new RoundingPendingInsightMetricAdjuster(0.5),
    ],
    [],
    4.2,
    96205.2,
  );
}
