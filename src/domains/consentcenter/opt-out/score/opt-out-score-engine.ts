import * as numbers from "../../../../kit/numbers.js";
import { OptOutScore } from "./opt-out-score.js";

/** One step of the opt out score calculation. */
export interface OptOutScoreAdjuster {
  describe(): string;
  adjust(item: OptOutScore, value: number): number;
}

export class RoundingOptOutScoreAdjuster implements OptOutScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapOptOutScoreAdjuster implements OptOutScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredOptOutScoreAdjuster implements OptOutScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumOptOutScoreAdjuster implements OptOutScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionOptOutScoreAdjuster implements OptOutScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: OptOutScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the opt out score steps in order and keeps a trace of each. */
export class OptOutScoreEngine {
  steps: OptOutScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutScore): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: OptOutScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutScoreEngine(): OptOutScoreEngine {
  return new OptOutScoreEngine(
    [
      new RoundingOptOutScoreAdjuster(0.05),
      new CapOptOutScoreAdjuster(2886),
      new TieredOptOutScoreAdjuster([233, 5073, 9902], [0.96, 1.15, 1.17]),
      new MinimumOptOutScoreAdjuster(42.5),
      new RegionOptOutScoreAdjuster(new Map<string, number>([["north", 0.92], ["online", 0.94]])),
    ],
    [],
    1.5,
    40410.4,
  );
}
