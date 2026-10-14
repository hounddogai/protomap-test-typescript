import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualComplaintMetric } from "./manual-complaint-metric.js";

/** One step of the manual complaint metric calculation. */
export interface ManualComplaintMetricModifier {
  describe(): string;
  adjust(item: ManualComplaintMetric, value: number): number;
}

export class ManualComplaintMetricPriorityOffsetAdjuster implements ManualComplaintMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ManualComplaintMetric, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapManualComplaintMetricAdjuster implements ManualComplaintMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualComplaintMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualComplaintMetricAdjuster implements ManualComplaintMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualComplaintMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualComplaintMetricAdjuster implements ManualComplaintMetricModifier {
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

  adjust(item: ManualComplaintMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual complaint metric steps in order and keeps a trace of each. */
export class ManualComplaintMetricEngine {
  steps: ManualComplaintMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualComplaintMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualComplaintMetric): number {
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

  evaluateAll(items: ManualComplaintMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualComplaintMetricEngine(flagsValue: flags.Registry): ManualComplaintMetricEngine {
  return new ManualComplaintMetricEngine(
    [
      new ManualComplaintMetricPriorityOffsetAdjuster(1.51),
      new CapManualComplaintMetricAdjuster(17636),
      new RoundingManualComplaintMetricAdjuster(0.05),
      new FlaggedManualComplaintMetricAdjuster(flagsValue, "manual-complaint-metric-primary", 5.2),
    ],
    [],
    2.7,
    92550.3,
  );
}
