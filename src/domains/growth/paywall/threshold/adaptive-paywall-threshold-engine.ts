import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePaywallThreshold } from "./adaptive-paywall-threshold.js";

/** One step of the adaptive paywall threshold calculation. */
export interface AdaptivePaywallThresholdFactor {
  describe(): string;
  adjust(item: AdaptivePaywallThreshold, value: number): number;
}

export class PercentAdaptivePaywallThresholdAdjuster implements AdaptivePaywallThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePaywallThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptivePaywallThresholdAdjuster implements AdaptivePaywallThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePaywallThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptivePaywallThresholdSequenceOffsetAdjuster implements AdaptivePaywallThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: AdaptivePaywallThreshold, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredAdaptivePaywallThresholdAdjuster implements AdaptivePaywallThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePaywallThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameAdaptivePaywallThresholdAdjuster implements AdaptivePaywallThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptivePaywallThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive paywall threshold steps in order and keeps a trace of each. */
export class AdaptivePaywallThresholdEngine {
  steps: AdaptivePaywallThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePaywallThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePaywallThreshold): number {
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

  evaluateAll(items: AdaptivePaywallThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePaywallThresholdEngine(): AdaptivePaywallThresholdEngine {
  return new AdaptivePaywallThresholdEngine(
    [
      new PercentAdaptivePaywallThresholdAdjuster(-16.9),
      new MinimumAdaptivePaywallThresholdAdjuster(9.1),
      new AdaptivePaywallThresholdSequenceOffsetAdjuster(0.92),
      new TieredAdaptivePaywallThresholdAdjuster([1942, 5437, 7181, 7883], [0.98, 1.07, 1.01, 1.05]),
      new NameAdaptivePaywallThresholdAdjuster(
        new Map<string, number>([["east", 0.86], ["west", 1.23], ["online", 0.84]]),
      ),
    ],
    [],
    1,
    97383.8,
  );
}
