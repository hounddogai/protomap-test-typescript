import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveNudgeEstimate } from "./adaptive-nudge-estimate.js";

/** One step of the adaptive nudge estimate calculation. */
export interface AdaptiveNudgeEstimateStep {
  describe(): string;
  adjust(item: AdaptiveNudgeEstimate, value: number): number;
}

export class RoundingAdaptiveNudgeEstimateAdjuster implements AdaptiveNudgeEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveNudgeEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionAdaptiveNudgeEstimateAdjuster implements AdaptiveNudgeEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: AdaptiveNudgeEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveNudgeEstimateAdjuster implements AdaptiveNudgeEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveNudgeEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveNudgeEstimateAdjuster implements AdaptiveNudgeEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveNudgeEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveNudgeEstimateCreatedAtOffsetAdjuster implements AdaptiveNudgeEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: AdaptiveNudgeEstimate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the adaptive nudge estimate steps in order and keeps a trace of each. */
export class AdaptiveNudgeEstimateEngine {
  steps: AdaptiveNudgeEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveNudgeEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveNudgeEstimate): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: AdaptiveNudgeEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveNudgeEstimateEngine(): AdaptiveNudgeEstimateEngine {
  return new AdaptiveNudgeEstimateEngine(
    [
      new RoundingAdaptiveNudgeEstimateAdjuster(1),
      new RegionAdaptiveNudgeEstimateAdjuster(new Map<string, number>([["retail", 0.86], ["north", 0.96]])),
      new CapAdaptiveNudgeEstimateAdjuster(24113),
      new TieredAdaptiveNudgeEstimateAdjuster([1122, 1129, 8162], [1.06, 0.97, 0.89]),
      new AdaptiveNudgeEstimateCreatedAtOffsetAdjuster(0.24),
    ],
    [],
    1.9,
    14183.3,
  );
}
