import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPacingMetric } from "./primary-pacing-metric.js";

/** One step of the primary pacing metric calculation. */
export interface PrimaryPacingMetricStep {
  describe(): string;
  adjust(item: PrimaryPacingMetric, value: number): number;
}

export class MinimumPrimaryPacingMetricAdjuster implements PrimaryPacingMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryPacingMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPrimaryPacingMetricAdjuster implements PrimaryPacingMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPacingMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryPacingMetricAdjuster implements PrimaryPacingMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPacingMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryPacingMetricAdjuster implements PrimaryPacingMetricStep {
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

  adjust(item: PrimaryPacingMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPrimaryPacingMetricAdjuster implements PrimaryPacingMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPacingMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryPacingMetricRatioOffsetAdjuster implements PrimaryPacingMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: PrimaryPacingMetric, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the primary pacing metric steps in order and keeps a trace of each. */
export class PrimaryPacingMetricEngine {
  steps: PrimaryPacingMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPacingMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPacingMetric): number {
    let current = item.netVolume();
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

  evaluateAll(items: PrimaryPacingMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPacingMetricEngine(flagsValue: flags.Registry): PrimaryPacingMetricEngine {
  return new PrimaryPacingMetricEngine(
    [
      new MinimumPrimaryPacingMetricAdjuster(38.2),
      new RoundingPrimaryPacingMetricAdjuster(0.05),
      new CapPrimaryPacingMetricAdjuster(31649),
      new FlaggedPrimaryPacingMetricAdjuster(flagsValue, "primary-pacing-metric-tiered", 3.2),
      new PercentPrimaryPacingMetricAdjuster(-15.3),
      new PrimaryPacingMetricRatioOffsetAdjuster(0.35),
    ],
    [],
    0.3,
    50917.2,
  );
}
