import * as numbers from "../../../../kit/numbers.js";
import { DeflectionRequest } from "./deflection-request.js";

/** One step of the deflection request calculation. */
export interface DeflectionRequestFactor {
  describe(): string;
  adjust(item: DeflectionRequest, value: number): number;
}

export class MinimumDeflectionRequestAdjuster implements DeflectionRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDeflectionRequestAdjuster implements DeflectionRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDeflectionRequestAdjuster implements DeflectionRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionRequestAdjuster implements DeflectionRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDeflectionRequestAdjuster implements DeflectionRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the deflection request steps in order and keeps a trace of each. */
export class DeflectionRequestEngine {
  steps: DeflectionRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionRequest): number {
    let current = item.netVolume();
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

  evaluateAll(items: DeflectionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionRequestEngine(): DeflectionRequestEngine {
  return new DeflectionRequestEngine(
    [
      new MinimumDeflectionRequestAdjuster(3),
      new RoundingDeflectionRequestAdjuster(5),
      new PercentDeflectionRequestAdjuster(11.3),
      new TieredDeflectionRequestAdjuster([3100, 4120, 4155, 4637], [1.1, 0.88, 0.94, 0.98]),
      new CapDeflectionRequestAdjuster(33499),
    ],
    [],
    3.1,
    9260.9,
  );
}
