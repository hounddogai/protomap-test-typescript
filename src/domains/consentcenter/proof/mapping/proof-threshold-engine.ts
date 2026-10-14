import * as numbers from "../../../../kit/numbers.js";
import { ProofThreshold } from "./proof-threshold.js";

/** One step of the proof threshold calculation. */
export interface ProofThresholdFactor {
  describe(): string;
  adjust(item: ProofThreshold, value: number): number;
}

export class LabelProofThresholdAdjuster implements ProofThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ProofThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofThresholdAdjuster implements ProofThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingProofThresholdAdjuster implements ProofThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the proof threshold steps in order and keeps a trace of each. */
export class ProofThresholdEngine {
  steps: ProofThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofThreshold): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ProofThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofThresholdEngine(): ProofThresholdEngine {
  return new ProofThresholdEngine(
    [
      new LabelProofThresholdAdjuster(new Map<string, number>([["retail", 1]])),
      new TieredProofThresholdAdjuster([4276, 5980, 6091, 7242], [1.08, 1.16, 0.87, 1.12]),
      new RoundingProofThresholdAdjuster(1),
    ],
    [],
    3.7,
    14403.1,
  );
}
