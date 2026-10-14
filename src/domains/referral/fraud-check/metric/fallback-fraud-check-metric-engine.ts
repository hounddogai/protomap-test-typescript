import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

/** One step of the fallback fraud check metric calculation. */
export interface FallbackFraudCheckMetricModifier {
  describe(): string;
  adjust(item: FallbackFraudCheckMetric, value: number): number;
}

export class NameFallbackFraudCheckMetricAdjuster implements FallbackFraudCheckMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackFraudCheckMetricAdjuster implements FallbackFraudCheckMetricModifier {
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

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackFraudCheckMetricAdjuster implements FallbackFraudCheckMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackFraudCheckMetricAttemptsOffsetAdjuster implements FallbackFraudCheckMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class MinimumFallbackFraudCheckMetricAdjuster implements FallbackFraudCheckMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFallbackFraudCheckMetricAdjuster implements FallbackFraudCheckMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFraudCheckMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback fraud check metric steps in order and keeps a trace of each. */
export class FallbackFraudCheckMetricEngine {
  steps: FallbackFraudCheckMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackFraudCheckMetric): number {
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

  evaluateAll(items: FallbackFraudCheckMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckMetricEngine(flagsValue: flags.Registry): FallbackFraudCheckMetricEngine {
  return new FallbackFraudCheckMetricEngine(
    [
      new NameFallbackFraudCheckMetricAdjuster(new Map<string, number>([["south", 1.35]])),
      new FlaggedFallbackFraudCheckMetricAdjuster(flagsValue, "fallback-fraud-check-metric-seasonal", 4.8),
      new PercentFallbackFraudCheckMetricAdjuster(-18.6),
      new FallbackFraudCheckMetricAttemptsOffsetAdjuster(1.46),
      new MinimumFallbackFraudCheckMetricAdjuster(4.7),
      new CapFallbackFraudCheckMetricAdjuster(7019),
    ],
    [],
    3.6,
    26479.4,
  );
}
