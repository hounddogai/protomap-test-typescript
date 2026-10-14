import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFlightGroup } from "./adaptive-flight-group.js";

/** One step of the adaptive flight group calculation. */
export interface AdaptiveFlightGroupStep {
  describe(): string;
  adjust(item: AdaptiveFlightGroup, value: number): number;
}

export class CapAdaptiveFlightGroupAdjuster implements AdaptiveFlightGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFlightGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveFlightGroupAdjuster implements AdaptiveFlightGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveFlightGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveFlightGroupAdjuster implements AdaptiveFlightGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveFlightGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptiveFlightGroupAdjuster implements AdaptiveFlightGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFlightGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive flight group steps in order and keeps a trace of each. */
export class AdaptiveFlightGroupEngine {
  steps: AdaptiveFlightGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFlightGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveFlightGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: AdaptiveFlightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveFlightGroupEngine(): AdaptiveFlightGroupEngine {
  return new AdaptiveFlightGroupEngine(
    [
      new CapAdaptiveFlightGroupAdjuster(44135),
      new TieredAdaptiveFlightGroupAdjuster([1572, 6577, 6868, 9819], [1.2, 0.86, 1.13, 0.86]),
      new RoundingAdaptiveFlightGroupAdjuster(1),
      new MinimumAdaptiveFlightGroupAdjuster(24),
    ],
    [],
    3.8,
    41684.8,
  );
}
