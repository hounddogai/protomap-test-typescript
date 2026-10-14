import * as numbers from "../../../../kit/numbers.js";
import { ProofWindow } from "./proof-window.js";

/** One step of the proof window calculation. */
export interface ProofWindowAdjuster {
  describe(): string;
  adjust(item: ProofWindow, value: number): number;
}

export class MinimumProofWindowAdjuster implements ProofWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ProofWindowRetriesOffsetAdjuster implements ProofWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ProofWindow, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredProofWindowAdjuster implements ProofWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryProofWindowAdjuster implements ProofWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ProofWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingProofWindowAdjuster implements ProofWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the proof window steps in order and keeps a trace of each. */
export class ProofWindowEngine {
  steps: ProofWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofWindow): number {
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

  evaluateAll(items: ProofWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofWindowEngine(): ProofWindowEngine {
  return new ProofWindowEngine(
    [
      new MinimumProofWindowAdjuster(48.2),
      new ProofWindowRetriesOffsetAdjuster(1.66),
      new TieredProofWindowAdjuster([188, 1544, 9917], [0.84, 0.99, 1.03]),
      new CategoryProofWindowAdjuster(new Map<string, number>([["central", 0.8], ["north", 1.22]])),
      new RoundingProofWindowAdjuster(5),
    ],
    [],
    2.4,
    4960.9,
  );
}
