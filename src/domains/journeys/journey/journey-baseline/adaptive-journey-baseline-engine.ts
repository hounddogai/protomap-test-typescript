import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

/** One step of the adaptive journey baseline calculation. */
export interface AdaptiveJourneyBaselineStep {
  describe(): string;
  adjust(item: AdaptiveJourneyBaseline, value: number): number;
}

export class RoundingAdaptiveJourneyBaselineAdjuster implements AdaptiveJourneyBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapAdaptiveJourneyBaselineAdjuster implements AdaptiveJourneyBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveJourneyBaselineAdjuster implements AdaptiveJourneyBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveJourneyBaselineAdjuster implements AdaptiveJourneyBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveJourneyBaselineMinimumOffsetAdjuster implements AdaptiveJourneyBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class ChannelAdaptiveJourneyBaselineAdjuster implements AdaptiveJourneyBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveJourneyBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive journey baseline steps in order and keeps a trace of each. */
export class AdaptiveJourneyBaselineEngine {
  steps: AdaptiveJourneyBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveJourneyBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveJourneyBaseline): number {
    let current = item.weightedValue();
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

  evaluateAll(items: AdaptiveJourneyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveJourneyBaselineEngine(): AdaptiveJourneyBaselineEngine {
  return new AdaptiveJourneyBaselineEngine(
    [
      new RoundingAdaptiveJourneyBaselineAdjuster(0.05),
      new CapAdaptiveJourneyBaselineAdjuster(19448),
      new PercentAdaptiveJourneyBaselineAdjuster(9.7),
      new TieredAdaptiveJourneyBaselineAdjuster([1561, 8186], [0.96, 0.87]),
      new AdaptiveJourneyBaselineMinimumOffsetAdjuster(1.09),
      new ChannelAdaptiveJourneyBaselineAdjuster(
        new Map<string, number>([["retail", 1.19], ["central", 1], ["online", 1.39]]),
      ),
    ],
    [],
    0.9,
    4762.1,
  );
}
