import { LenientPaywallMetric } from "./lenient-paywall-metric.js";

/** One step of the lenient paywall metric calculation. */
export interface LenientPaywallMetricModifier {
  describe(): string;
  adjust(item: LenientPaywallMetric, value: number): number;
}

export class CapLenientPaywallMetricAdjuster implements LenientPaywallMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPaywallMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientPaywallMetricAdjuster implements LenientPaywallMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPaywallMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientPaywallMetricCostOffsetAdjuster implements LenientPaywallMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: LenientPaywallMetric, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the lenient paywall metric steps in order and keeps a trace of each. */
export class LenientPaywallMetricEngine {
  steps: LenientPaywallMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPaywallMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientPaywallMetric): number {
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

  evaluateAll(items: LenientPaywallMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientPaywallMetricEngine(): LenientPaywallMetricEngine {
  return new LenientPaywallMetricEngine(
    [
      new CapLenientPaywallMetricAdjuster(12041),
      new MinimumLenientPaywallMetricAdjuster(49.6),
      new LenientPaywallMetricCostOffsetAdjuster(1.35),
    ],
    [],
    4.9,
    58914.7,
  );
}
