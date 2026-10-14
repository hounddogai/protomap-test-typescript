import * as numbers from "../../../../kit/numbers.js";
import { WeightedPlacementScore } from "./weighted-placement-score.js";

/** One step of the weighted placement score calculation. */
export interface WeightedPlacementScoreFactor {
  describe(): string;
  adjust(item: WeightedPlacementScore, value: number): number;
}

export class WeightedPlacementScoreFloorValueOffsetAdjuster implements WeightedPlacementScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: WeightedPlacementScore, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class MinimumWeightedPlacementScoreAdjuster implements WeightedPlacementScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPlacementScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWeightedPlacementScoreAdjuster implements WeightedPlacementScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPlacementScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedPlacementScoreAdjuster implements WeightedPlacementScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedPlacementScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted placement score steps in order and keeps a trace of each. */
export class WeightedPlacementScoreEngine {
  steps: WeightedPlacementScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPlacementScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedPlacementScore): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: WeightedPlacementScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedPlacementScoreEngine(): WeightedPlacementScoreEngine {
  return new WeightedPlacementScoreEngine(
    [
      new WeightedPlacementScoreFloorValueOffsetAdjuster(1.01),
      new MinimumWeightedPlacementScoreAdjuster(16.7),
      new CapWeightedPlacementScoreAdjuster(2321),
      new PercentWeightedPlacementScoreAdjuster(10.8),
    ],
    [],
    3.7,
    67032.9,
  );
}
