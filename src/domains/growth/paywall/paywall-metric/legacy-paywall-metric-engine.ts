import * as numbers from "../../../../kit/numbers.js";
import { LegacyPaywallMetric } from "./legacy-paywall-metric.js";

/** One step of the legacy paywall metric calculation. */
export interface LegacyPaywallMetricAdjuster {
  describe(): string;
  adjust(item: LegacyPaywallMetric, value: number): number;
}

export class TitleLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLegacyPaywallMetricAdjuster implements LegacyPaywallMetricAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPaywallMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy paywall metric steps in order and keeps a trace of each. */
export class LegacyPaywallMetricEngine {
  steps: LegacyPaywallMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPaywallMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyPaywallMetric): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LegacyPaywallMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyPaywallMetricEngine(): LegacyPaywallMetricEngine {
  return new LegacyPaywallMetricEngine(
    [
      new TitleLegacyPaywallMetricAdjuster(
        new Map<string, number>([["online", 1.33], ["retail", 0.99], ["east", 0.78]]),
      ),
      new CapLegacyPaywallMetricAdjuster(18529),
      new PercentLegacyPaywallMetricAdjuster(0.3),
      new TieredLegacyPaywallMetricAdjuster([2659, 3727, 8315], [0.86, 0.84, 1.19]),
      new RoundingLegacyPaywallMetricAdjuster(1),
      new MinimumLegacyPaywallMetricAdjuster(1),
    ],
    [],
    1.6,
    80501.7,
  );
}
