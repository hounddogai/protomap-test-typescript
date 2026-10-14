import * as numbers from "../../../../kit/numbers.js";
import { ProofSummary } from "./proof-summary.js";

/** One step of the proof summary calculation. */
export interface ProofSummaryFactor {
  describe(): string;
  adjust(item: ProofSummary, value: number): number;
}

export class RoundingProofSummaryAdjuster implements ProofSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredProofSummaryAdjuster implements ProofSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumProofSummaryAdjuster implements ProofSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the proof summary steps in order and keeps a trace of each. */
export class ProofSummaryEngine {
  steps: ProofSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ProofSummary): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ProofSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultProofSummaryEngine(): ProofSummaryEngine {
  return new ProofSummaryEngine(
    [
      new RoundingProofSummaryAdjuster(5),
      new TieredProofSummaryAdjuster([3036, 3687, 8119, 9109], [0.82, 1.07, 0.83, 0.96]),
      new MinimumProofSummaryAdjuster(9.6),
    ],
    [],
    1.8,
    60876.7,
  );
}
