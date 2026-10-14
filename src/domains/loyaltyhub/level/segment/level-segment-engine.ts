import * as numbers from "../../../../kit/numbers.js";
import { LevelSegment } from "./level-segment.js";

/** One step of the level segment calculation. */
export interface LevelSegmentAdjuster {
  describe(): string;
  adjust(item: LevelSegment, value: number): number;
}

export class LevelSegmentRateOffsetAdjuster implements LevelSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LevelSegment, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredLevelSegmentAdjuster implements LevelSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryLevelSegmentAdjuster implements LevelSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LevelSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the level segment steps in order and keeps a trace of each. */
export class LevelSegmentEngine {
  steps: LevelSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelSegment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LevelSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelSegmentEngine(): LevelSegmentEngine {
  return new LevelSegmentEngine(
    [
      new LevelSegmentRateOffsetAdjuster(0.62),
      new TieredLevelSegmentAdjuster([1528, 7272], [1.06, 0.86]),
      new CategoryLevelSegmentAdjuster(
        new Map<string, number>([["south", 1.09], ["online", 1.1], ["east", 1.19]]),
      ),
    ],
    [],
    4.2,
    6668.1,
  );
}
