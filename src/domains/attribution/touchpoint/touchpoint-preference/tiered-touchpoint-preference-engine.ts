import * as numbers from "../../../../kit/numbers.js";
import { TieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

/** One step of the tiered touchpoint preference calculation. */
export interface TieredTouchpointPreferenceAdjuster {
  describe(): string;
  adjust(item: TieredTouchpointPreference, value: number): number;
}

export class RoundingTieredTouchpointPreferenceAdjuster implements TieredTouchpointPreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredTouchpointPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTouchpointPreferenceQuantityOffsetAdjuster implements TieredTouchpointPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TieredTouchpointPreference, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumTieredTouchpointPreferenceAdjuster implements TieredTouchpointPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredTouchpointPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredTouchpointPreferenceAdjuster implements TieredTouchpointPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredTouchpointPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered touchpoint preference steps in order and keeps a trace of each. */
export class TieredTouchpointPreferenceEngine {
  steps: TieredTouchpointPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTouchpointPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredTouchpointPreference): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredTouchpointPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredTouchpointPreferenceEngine(): TieredTouchpointPreferenceEngine {
  return new TieredTouchpointPreferenceEngine(
    [
      new RoundingTieredTouchpointPreferenceAdjuster(0.05),
      new TieredTouchpointPreferenceQuantityOffsetAdjuster(0.44),
      new MinimumTieredTouchpointPreferenceAdjuster(45),
      new TieredTieredTouchpointPreferenceAdjuster([3509, 8112, 9244], [1.06, 0.81, 1.17]),
    ],
    [],
    2.3,
    60698.5,
  );
}
