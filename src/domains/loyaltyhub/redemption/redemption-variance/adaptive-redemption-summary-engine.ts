import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

/** One step of the adaptive redemption summary calculation. */
export interface AdaptiveRedemptionSummaryModifier {
  describe(): string;
  adjust(item: AdaptiveRedemptionSummary, value: number): number;
}

export class TieredAdaptiveRedemptionSummaryAdjuster implements AdaptiveRedemptionSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveRedemptionSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveRedemptionSummaryAdjuster implements AdaptiveRedemptionSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRedemptionSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveRedemptionSummaryDurationMinutesOffsetAdjuster implements AdaptiveRedemptionSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: AdaptiveRedemptionSummary, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapAdaptiveRedemptionSummaryAdjuster implements AdaptiveRedemptionSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveRedemptionSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveRedemptionSummaryAdjuster implements AdaptiveRedemptionSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveRedemptionSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive redemption summary steps in order and keeps a trace of each. */
export class AdaptiveRedemptionSummaryEngine {
  steps: AdaptiveRedemptionSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRedemptionSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveRedemptionSummary): number {
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

  evaluateAll(items: AdaptiveRedemptionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveRedemptionSummaryEngine(): AdaptiveRedemptionSummaryEngine {
  return new AdaptiveRedemptionSummaryEngine(
    [
      new TieredAdaptiveRedemptionSummaryAdjuster([4467, 5085, 7059], [1.18, 0.99, 1.08]),
      new RoundingAdaptiveRedemptionSummaryAdjuster(0.1),
      new AdaptiveRedemptionSummaryDurationMinutesOffsetAdjuster(0.55),
      new CapAdaptiveRedemptionSummaryAdjuster(24928),
      new MinimumAdaptiveRedemptionSummaryAdjuster(38.1),
    ],
    [],
    2.8,
    16643.3,
  );
}
