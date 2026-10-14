import * as numbers from "../../../../kit/numbers.js";
import { PlacementSegment } from "./placement-segment.js";

/** One step of the placement segment calculation. */
export interface PlacementSegmentAdjuster {
  describe(): string;
  adjust(item: PlacementSegment, value: number): number;
}

export class PlacementSegmentGraceDaysOffsetAdjuster implements PlacementSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PlacementSegment, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentPlacementSegmentAdjuster implements PlacementSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPlacementSegmentAdjuster implements PlacementSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPlacementSegmentAdjuster implements PlacementSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitPlacementSegmentAdjuster implements PlacementSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PlacementSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPlacementSegmentAdjuster implements PlacementSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the placement segment steps in order and keeps a trace of each. */
export class PlacementSegmentEngine {
  steps: PlacementSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementSegment): number {
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

  evaluateAll(items: PlacementSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementSegmentEngine(): PlacementSegmentEngine {
  return new PlacementSegmentEngine(
    [
      new PlacementSegmentGraceDaysOffsetAdjuster(0.62),
      new PercentPlacementSegmentAdjuster(10.2),
      new MinimumPlacementSegmentAdjuster(2.5),
      new RoundingPlacementSegmentAdjuster(1),
      new UnitPlacementSegmentAdjuster(
        new Map<string, number>([["retail", 1.18], ["south", 1.3], ["west", 1.05]]),
      ),
      new TieredPlacementSegmentAdjuster([343, 2499, 8673], [1.02, 0.97, 0.86]),
    ],
    [],
    0.2,
    13820.8,
  );
}
