import * as numbers from "../../../../kit/numbers.js";
import { BounceBatch } from "./bounce-batch.js";

/** One step of the bounce batch calculation. */
export interface BounceBatchAdjuster {
  describe(): string;
  adjust(item: BounceBatch, value: number): number;
}

export class ChannelBounceBatchAdjuster implements BounceBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BounceBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BounceBatchCeilingOffsetAdjuster implements BounceBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: BounceBatch, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumBounceBatchAdjuster implements BounceBatchAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingBounceBatchAdjuster implements BounceBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBounceBatchAdjuster implements BounceBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBounceBatchAdjuster implements BounceBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the bounce batch steps in order and keeps a trace of each. */
export class BounceBatchEngine {
  steps: BounceBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BounceBatch): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BounceBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBounceBatchEngine(): BounceBatchEngine {
  return new BounceBatchEngine(
    [
      new ChannelBounceBatchAdjuster(
        new Map<string, number>([["east", 1.08], ["west", 1.13], ["central", 1.39]]),
      ),
      new BounceBatchCeilingOffsetAdjuster(1.19),
      new MinimumBounceBatchAdjuster(3.5),
      new RoundingBounceBatchAdjuster(0.5),
      new TieredBounceBatchAdjuster([1770, 3614, 8223], [0.86, 0.82, 0.83]),
      new CapBounceBatchAdjuster(49955),
    ],
    [],
    4.3,
    1685.2,
  );
}
