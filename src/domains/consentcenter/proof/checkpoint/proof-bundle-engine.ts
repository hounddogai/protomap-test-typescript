import * as numbers from "../../../../kit/numbers.js";
import { ProofBundle } from "./proof-bundle.js";

/** One step of the proof bundle calculation. */
export interface ProofBundleModifier {
  describe(): string;
  adjust(item: ProofBundle, value: number): number;
}

export class PercentProofBundleAdjuster implements ProofBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingProofBundleAdjuster implements ProofBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumProofBundleAdjuster implements ProofBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ProofBundleCeilingOffsetAdjuster implements ProofBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ProofBundle, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class SegmentProofBundleAdjuster implements ProofBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ProofBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the proof bundle steps in order and keeps a trace of each. */
export class ProofBundleEngine {
  steps: ProofBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofBundle): number {
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

  evaluateAll(items: ProofBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofBundleEngine(): ProofBundleEngine {
  return new ProofBundleEngine(
    [
      new PercentProofBundleAdjuster(-23.1),
      new RoundingProofBundleAdjuster(0.25),
      new MinimumProofBundleAdjuster(34.6),
      new ProofBundleCeilingOffsetAdjuster(1.81),
      new SegmentProofBundleAdjuster(new Map<string, number>([["north", 0.98]])),
    ],
    [],
    1.3,
    96354.3,
  );
}
