import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWarmupWindow } from "./seasonal-warmup-window.js";

/** One step of the seasonal warmup window calculation. */
export interface SeasonalWarmupWindowAdjuster {
  describe(): string;
  adjust(item: SeasonalWarmupWindow, value: number): number;
}

export class SeasonalWarmupWindowRatioOffsetAdjuster implements SeasonalWarmupWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: SeasonalWarmupWindow, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class MinimumSeasonalWarmupWindowAdjuster implements SeasonalWarmupWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalWarmupWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalWarmupWindowAdjuster implements SeasonalWarmupWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalWarmupWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSeasonalWarmupWindowAdjuster implements SeasonalWarmupWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWarmupWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal warmup window steps in order and keeps a trace of each. */
export class SeasonalWarmupWindowEngine {
  steps: SeasonalWarmupWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWarmupWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalWarmupWindow): number {
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

  evaluateAll(items: SeasonalWarmupWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalWarmupWindowEngine(): SeasonalWarmupWindowEngine {
  return new SeasonalWarmupWindowEngine(
    [
      new SeasonalWarmupWindowRatioOffsetAdjuster(1.5),
      new MinimumSeasonalWarmupWindowAdjuster(28.9),
      new TieredSeasonalWarmupWindowAdjuster([3262, 4164, 4649, 8534], [1.19, 0.96, 0.88, 1.06]),
      new RoundingSeasonalWarmupWindowAdjuster(0.1),
    ],
    [],
    4.6,
    84620.6,
  );
}
