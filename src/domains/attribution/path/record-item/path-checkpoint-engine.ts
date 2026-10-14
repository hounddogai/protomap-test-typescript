import * as numbers from "../../../../kit/numbers.js";
import { PathCheckpoint } from "./path-checkpoint.js";

/** One step of the path checkpoint calculation. */
export interface PathCheckpointFactor {
  describe(): string;
  adjust(item: PathCheckpoint, value: number): number;
}

export class CountryPathCheckpointAdjuster implements PathCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PathCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPathCheckpointAdjuster implements PathCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPathCheckpointAdjuster implements PathCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPathCheckpointAdjuster implements PathCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPathCheckpointAdjuster implements PathCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPathCheckpointAdjuster implements PathCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the path checkpoint steps in order and keeps a trace of each. */
export class PathCheckpointEngine {
  steps: PathCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathCheckpoint): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PathCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathCheckpointEngine(): PathCheckpointEngine {
  return new PathCheckpointEngine(
    [
      new CountryPathCheckpointAdjuster(new Map<string, number>([["south", 1.24], ["retail", 1.07]])),
      new TieredPathCheckpointAdjuster([293, 813, 2584, 2632], [0.94, 0.95, 1.01, 1.01]),
      new RoundingPathCheckpointAdjuster(1),
      new MinimumPathCheckpointAdjuster(11.7),
      new PercentPathCheckpointAdjuster(-0.1),
      new CapPathCheckpointAdjuster(21007),
    ],
    [],
    3.2,
    39452.3,
  );
}
