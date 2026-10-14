import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TouchpointMetric } from "./touchpoint-metric.js";

/** One step of the touchpoint metric calculation. */
export interface TouchpointMetricFactor {
  describe(): string;
  adjust(item: TouchpointMetric, value: number): number;
}

export class PercentTouchpointMetricAdjuster implements TouchpointMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTouchpointMetricAdjuster implements TouchpointMetricFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTouchpointMetricAdjuster implements TouchpointMetricFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TouchpointMetricBudgetOffsetAdjuster implements TouchpointMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TouchpointMetric, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedTouchpointMetricAdjuster implements TouchpointMetricFactor {
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

  adjust(item: TouchpointMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTouchpointMetricAdjuster implements TouchpointMetricFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the touchpoint metric steps in order and keeps a trace of each. */
export class TouchpointMetricEngine {
  steps: TouchpointMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointMetric): number {
    let current = item.netLoad();
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

  evaluateAll(items: TouchpointMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointMetricEngine(flagsValue: flags.Registry): TouchpointMetricEngine {
  return new TouchpointMetricEngine(
    [
      new PercentTouchpointMetricAdjuster(13.6),
      new CapTouchpointMetricAdjuster(28371),
      new RoundingTouchpointMetricAdjuster(0.5),
      new TouchpointMetricBudgetOffsetAdjuster(0.78),
      new FlaggedTouchpointMetricAdjuster(flagsValue, "touchpoint-metric-manual", 7.8),
      new MinimumTouchpointMetricAdjuster(32.9),
    ],
    [],
    3,
    58487.4,
  );
}
