import * as numbers from "../../../../kit/numbers.js";
import { JourneyRequest } from "./journey-request.js";

/** One step of the journey request calculation. */
export interface JourneyRequestAdjuster {
  describe(): string;
  adjust(item: JourneyRequest, value: number): number;
}

export class TieredJourneyRequestAdjuster implements JourneyRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingJourneyRequestAdjuster implements JourneyRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumJourneyRequestAdjuster implements JourneyRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameJourneyRequestAdjuster implements JourneyRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: JourneyRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the journey request steps in order and keeps a trace of each. */
export class JourneyRequestEngine {
  steps: JourneyRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: JourneyRequest): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: JourneyRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultJourneyRequestEngine(): JourneyRequestEngine {
  return new JourneyRequestEngine(
    [
      new TieredJourneyRequestAdjuster([852, 6583, 8088, 9764], [0.82, 0.86, 1.07, 1.17]),
      new RoundingJourneyRequestAdjuster(5),
      new MinimumJourneyRequestAdjuster(27.1),
      new NameJourneyRequestAdjuster(new Map<string, number>([["west", 1.2], ["south", 0.72]])),
    ],
    [],
    2.5,
    84678.7,
  );
}
