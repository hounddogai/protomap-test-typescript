import * as numbers from "../../../../kit/numbers.js";
import { PlacementEstimate } from "./placement-estimate.js";

/** One step of the placement estimate calculation. */
export interface PlacementEstimateModifier {
  describe(): string;
  adjust(item: PlacementEstimate, value: number): number;
}

export class MinimumPlacementEstimateAdjuster implements PlacementEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PlacementEstimateEndsAtOffsetAdjuster implements PlacementEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: PlacementEstimate, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TieredPlacementEstimateAdjuster implements PlacementEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPlacementEstimateAdjuster implements PlacementEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPlacementEstimateAdjuster implements PlacementEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocalePlacementEstimateAdjuster implements PlacementEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PlacementEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the placement estimate steps in order and keeps a trace of each. */
export class PlacementEstimateEngine {
  steps: PlacementEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PlacementEstimate): number {
    let current = item.netTotal();
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

  evaluateAll(items: PlacementEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPlacementEstimateEngine(): PlacementEstimateEngine {
  return new PlacementEstimateEngine(
    [
      new MinimumPlacementEstimateAdjuster(35.1),
      new PlacementEstimateEndsAtOffsetAdjuster(0.2),
      new TieredPlacementEstimateAdjuster([5115, 5533, 6749], [1, 1.12, 0.96]),
      new PercentPlacementEstimateAdjuster(0.4),
      new RoundingPlacementEstimateAdjuster(1),
      new LocalePlacementEstimateAdjuster(
        new Map<string, number>([["online", 1.39], ["east", 1.37], ["north", 0.95]]),
      ),
    ],
    [],
    1.1,
    85025.9,
  );
}
