import * as numbers from "../../../../kit/numbers.js";
import { DeflectionCheckpoint } from "./deflection-checkpoint.js";

/** One step of the deflection checkpoint calculation. */
export interface DeflectionCheckpointModifier {
  describe(): string;
  adjust(item: DeflectionCheckpoint, value: number): number;
}

export class DeflectionCheckpointWeightOffsetAdjuster implements DeflectionCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: DeflectionCheckpoint, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class TieredDeflectionCheckpointAdjuster implements DeflectionCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDeflectionCheckpointAdjuster implements DeflectionCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDeflectionCheckpointAdjuster implements DeflectionCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDeflectionCheckpointAdjuster implements DeflectionCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the deflection checkpoint steps in order and keeps a trace of each. */
export class DeflectionCheckpointEngine {
  steps: DeflectionCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DeflectionCheckpoint): number {
    let current = item.netExposure();
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

  evaluateAll(items: DeflectionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDeflectionCheckpointEngine(): DeflectionCheckpointEngine {
  return new DeflectionCheckpointEngine(
    [
      new DeflectionCheckpointWeightOffsetAdjuster(0.99),
      new TieredDeflectionCheckpointAdjuster([701, 1257, 5274, 7277], [1.11, 1.06, 1.17, 1.1]),
      new RoundingDeflectionCheckpointAdjuster(1),
      new MinimumDeflectionCheckpointAdjuster(3.9),
      new CapDeflectionCheckpointAdjuster(20019),
    ],
    [],
    3.8,
    31895.6,
  );
}
