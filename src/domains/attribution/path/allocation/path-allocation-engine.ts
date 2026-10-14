import * as numbers from "../../../../kit/numbers.js";
import { PathAllocation } from "./path-allocation.js";

/** One step of the path allocation calculation. */
export interface PathAllocationFactor {
  describe(): string;
  adjust(item: PathAllocation, value: number): number;
}

export class RoundingPathAllocationAdjuster implements PathAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPathAllocationAdjuster implements PathAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPathAllocationAdjuster implements PathAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the path allocation steps in order and keeps a trace of each. */
export class PathAllocationEngine {
  steps: PathAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathAllocation): number {
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

  evaluateAll(items: PathAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathAllocationEngine(): PathAllocationEngine {
  return new PathAllocationEngine(
    [
      new RoundingPathAllocationAdjuster(1),
      new PercentPathAllocationAdjuster(-12.4),
      new TieredPathAllocationAdjuster([652, 1799], [0.96, 1]),
    ],
    [],
    3.5,
    74368.3,
  );
}
