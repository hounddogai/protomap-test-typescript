import * as numbers from "../../../../kit/numbers.js";
import { StrictProofCheckpoint } from "./strict-proof-checkpoint.js";

/** One step of the strict proof checkpoint calculation. */
export interface StrictProofCheckpointModifier {
  describe(): string;
  adjust(item: StrictProofCheckpoint, value: number): number;
}

export class RoundingStrictProofCheckpointAdjuster implements StrictProofCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictProofCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStrictProofCheckpointAdjuster implements StrictProofCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictProofCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameStrictProofCheckpointAdjuster implements StrictProofCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StrictProofCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictProofCheckpointAdjuster implements StrictProofCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictProofCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictProofCheckpointAdjuster implements StrictProofCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictProofCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict proof checkpoint steps in order and keeps a trace of each. */
export class StrictProofCheckpointEngine {
  steps: StrictProofCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictProofCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictProofCheckpoint): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StrictProofCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictProofCheckpointEngine(): StrictProofCheckpointEngine {
  return new StrictProofCheckpointEngine(
    [
      new RoundingStrictProofCheckpointAdjuster(0.05),
      new TieredStrictProofCheckpointAdjuster([288, 3981, 5408, 6202], [1.02, 1.16, 0.81, 1.07]),
      new NameStrictProofCheckpointAdjuster(new Map<string, number>([["online", 0.89], ["south", 0.78]])),
      new MinimumStrictProofCheckpointAdjuster(46.7),
      new CapStrictProofCheckpointAdjuster(25785),
    ],
    [],
    0.2,
    8812.2,
  );
}
