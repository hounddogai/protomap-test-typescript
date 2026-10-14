import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientConversionMetric } from "./lenient-conversion-metric.js";

/** One step of the lenient conversion metric calculation. */
export interface LenientConversionMetricStep {
  describe(): string;
  adjust(item: LenientConversionMetric, value: number): number;
}

export class LenientConversionMetricPriorityOffsetAdjuster implements LenientConversionMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: LenientConversionMetric, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapLenientConversionMetricAdjuster implements LenientConversionMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientConversionMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientConversionMetricAdjuster implements LenientConversionMetricStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientConversionMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelLenientConversionMetricAdjuster implements LenientConversionMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientConversionMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientConversionMetricAdjuster implements LenientConversionMetricStep {
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

  adjust(item: LenientConversionMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient conversion metric steps in order and keeps a trace of each. */
export class LenientConversionMetricEngine {
  steps: LenientConversionMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientConversionMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientConversionMetric): number {
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

  evaluateAll(items: LenientConversionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientConversionMetricEngine(flagsValue: flags.Registry): LenientConversionMetricEngine {
  return new LenientConversionMetricEngine(
    [
      new LenientConversionMetricPriorityOffsetAdjuster(1.09),
      new CapLenientConversionMetricAdjuster(35023),
      new PercentLenientConversionMetricAdjuster(-10),
      new ChannelLenientConversionMetricAdjuster(new Map<string, number>([["south", 1.36]])),
      new FlaggedLenientConversionMetricAdjuster(flagsValue, "lenient-conversion-metric-fallback", 6.3),
    ],
    [],
    4.2,
    85319.8,
  );
}
