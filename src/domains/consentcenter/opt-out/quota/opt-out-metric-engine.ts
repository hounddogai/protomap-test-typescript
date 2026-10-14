import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutMetric } from "./opt-out-metric.js";

/** One step of the opt out metric calculation. */
export interface OptOutMetricAdjuster {
  describe(): string;
  adjust(item: OptOutMetric, value: number): number;
}

export class FlaggedOptOutMetricAdjuster implements OptOutMetricAdjuster {
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

  adjust(item: OptOutMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutMetricAdjuster implements OptOutMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingOptOutMetricAdjuster implements OptOutMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentOptOutMetricAdjuster implements OptOutMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelOptOutMetricAdjuster implements OptOutMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: OptOutMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the opt out metric steps in order and keeps a trace of each. */
export class OptOutMetricEngine {
  steps: OptOutMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutMetric): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: OptOutMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutMetricEngine(flagsValue: flags.Registry): OptOutMetricEngine {
  return new OptOutMetricEngine(
    [
      new FlaggedOptOutMetricAdjuster(flagsValue, "opt-out-metric-tiered", 8.4),
      new MinimumOptOutMetricAdjuster(6.2),
      new RoundingOptOutMetricAdjuster(5),
      new PercentOptOutMetricAdjuster(-24),
      new LabelOptOutMetricAdjuster(new Map<string, number>([["south", 0.92]])),
    ],
    [],
    1.2,
    33078,
  );
}
