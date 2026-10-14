import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDomainMetric } from "./adaptive-domain-metric.js";

/** One step of the adaptive domain metric calculation. */
export interface AdaptiveDomainMetricModifier {
  describe(): string;
  adjust(item: AdaptiveDomainMetric, value: number): number;
}

export class RoundingAdaptiveDomainMetricAdjuster implements AdaptiveDomainMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDomainMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredAdaptiveDomainMetricAdjuster implements AdaptiveDomainMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveDomainMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveDomainMetricAdjuster implements AdaptiveDomainMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDomainMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceAdaptiveDomainMetricAdjuster implements AdaptiveDomainMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptiveDomainMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveDomainMetricAdjuster implements AdaptiveDomainMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveDomainMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive domain metric steps in order and keeps a trace of each. */
export class AdaptiveDomainMetricEngine {
  steps: AdaptiveDomainMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDomainMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveDomainMetric): number {
    let current = item.projectedValue();
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

  evaluateAll(items: AdaptiveDomainMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveDomainMetricEngine(): AdaptiveDomainMetricEngine {
  return new AdaptiveDomainMetricEngine(
    [
      new RoundingAdaptiveDomainMetricAdjuster(0.5),
      new TieredAdaptiveDomainMetricAdjuster([2773, 6549, 7341, 8061], [1.19, 0.9, 0.98, 0.96]),
      new MinimumAdaptiveDomainMetricAdjuster(21.4),
      new UtmSourceAdaptiveDomainMetricAdjuster(new Map<string, number>([["east", 1.17], ["retail", 1.04]])),
      new CapAdaptiveDomainMetricAdjuster(9021),
    ],
    [],
    2.5,
    68049.1,
  );
}
