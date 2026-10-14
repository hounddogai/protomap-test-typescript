import * as flags from "../../../../kit/flags.js";
import { JourneyMetric } from "./journey-metric.js";

/** One step of the journey metric calculation. */
export interface JourneyMetricAdjuster {
  describe(): string;
  adjust(item: JourneyMetric, value: number): number;
}

export class MinimumJourneyMetricAdjuster implements JourneyMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameJourneyMetricAdjuster implements JourneyMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: JourneyMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedJourneyMetricAdjuster implements JourneyMetricAdjuster {
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

  adjust(item: JourneyMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentJourneyMetricAdjuster implements JourneyMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapJourneyMetricAdjuster implements JourneyMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredJourneyMetricAdjuster implements JourneyMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the journey metric steps in order and keeps a trace of each. */
export class JourneyMetricEngine {
  steps: JourneyMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyMetric): number {
    let current = item.netExposure();
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

  evaluateAll(items: JourneyMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyMetricEngine(flagsValue: flags.Registry): JourneyMetricEngine {
  return new JourneyMetricEngine(
    [
      new MinimumJourneyMetricAdjuster(8.4),
      new NameJourneyMetricAdjuster(new Map<string, number>([["online", 1.07], ["east", 1.24], ["west", 1.08]])),
      new FlaggedJourneyMetricAdjuster(flagsValue, "journey-metric-fallback", -5.3),
      new PercentJourneyMetricAdjuster(-5.2),
      new CapJourneyMetricAdjuster(24612),
      new TieredJourneyMetricAdjuster([1337, 2421, 4629], [0.85, 0.82, 0.82]),
    ],
    [],
    3.9,
    61543.3,
  );
}
