import * as numbers from "../../../../kit/numbers.js";
import { ProofRequest } from "./proof-request.js";

/** One step of the proof request calculation. */
export interface ProofRequestAdjuster {
  describe(): string;
  adjust(item: ProofRequest, value: number): number;
}

export class CapProofRequestAdjuster implements ProofRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumProofRequestAdjuster implements ProofRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionProofRequestAdjuster implements ProofRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ProofRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofRequestAdjuster implements ProofRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingProofRequestAdjuster implements ProofRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the proof request steps in order and keeps a trace of each. */
export class ProofRequestEngine {
  steps: ProofRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofRequest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ProofRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofRequestEngine(): ProofRequestEngine {
  return new ProofRequestEngine(
    [
      new CapProofRequestAdjuster(47563),
      new MinimumProofRequestAdjuster(22.6),
      new RegionProofRequestAdjuster(new Map<string, number>([["west", 0.76]])),
      new TieredProofRequestAdjuster([1847, 2270, 4536, 7673], [0.84, 0.91, 1.06, 0.88]),
      new RoundingProofRequestAdjuster(0.1),
    ],
    [],
    2,
    65655.4,
  );
}
