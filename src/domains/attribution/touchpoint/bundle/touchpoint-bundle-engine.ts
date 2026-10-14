import * as numbers from "../../../../kit/numbers.js";
import { TouchpointBundle } from "./touchpoint-bundle.js";

/** One step of the touchpoint bundle calculation. */
export interface TouchpointBundleFactor {
  describe(): string;
  adjust(item: TouchpointBundle, value: number): number;
}

export class MinimumTouchpointBundleAdjuster implements TouchpointBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTouchpointBundleAdjuster implements TouchpointBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTouchpointBundleAdjuster implements TouchpointBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTouchpointBundleAdjuster implements TouchpointBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TouchpointBundleBudgetOffsetAdjuster implements TouchpointBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TouchpointBundle, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the touchpoint bundle steps in order and keeps a trace of each. */
export class TouchpointBundleEngine {
  steps: TouchpointBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TouchpointBundle): number {
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

  evaluateAll(items: TouchpointBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTouchpointBundleEngine(): TouchpointBundleEngine {
  return new TouchpointBundleEngine(
    [
      new MinimumTouchpointBundleAdjuster(44.8),
      new RoundingTouchpointBundleAdjuster(0.25),
      new CapTouchpointBundleAdjuster(28603),
      new TieredTouchpointBundleAdjuster([2537, 5432, 5516, 9814], [1.08, 1.02, 0.92, 0.81]),
      new TouchpointBundleBudgetOffsetAdjuster(1.55),
    ],
    [],
    1.2,
    22612.5,
  );
}
