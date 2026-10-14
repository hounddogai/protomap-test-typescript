import * as numbers from "../../../../kit/numbers.js";
import { PathWindow } from "./path-window.js";

/** One step of the path window calculation. */
export interface PathWindowStep {
  describe(): string;
  adjust(item: PathWindow, value: number): number;
}

export class TitlePathWindowAdjuster implements PathWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PathWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPathWindowAdjuster implements PathWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPathWindowAdjuster implements PathWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the path window steps in order and keeps a trace of each. */
export class PathWindowEngine {
  steps: PathWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathWindow): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PathWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathWindowEngine(): PathWindowEngine {
  return new PathWindowEngine(
    [
      new TitlePathWindowAdjuster(new Map<string, number>([["west", 0.75], ["south", 0.72]])),
      new CapPathWindowAdjuster(27638),
      new TieredPathWindowAdjuster([425, 5446], [1.13, 1.02]),
    ],
    [],
    5,
    36203,
  );
}
