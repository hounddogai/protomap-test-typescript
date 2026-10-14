import * as flags from "../../../../kit/flags.js";
import { ProofRollup } from "./proof-rollup.js";

/** One step of the proof rollup calculation. */
export interface ProofRollupModifier {
  describe(): string;
  adjust(item: ProofRollup, value: number): number;
}

export class TieredProofRollupAdjuster implements ProofRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedProofRollupAdjuster implements ProofRollupModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ProofRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentProofRollupAdjuster implements ProofRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ProofRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumProofRollupAdjuster implements ProofRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ProofRollupScoreOffsetAdjuster implements ProofRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ProofRollup, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the proof rollup steps in order and keeps a trace of each. */
export class ProofRollupEngine {
  steps: ProofRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofRollup): number {
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

  evaluateAll(items: ProofRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofRollupEngine(flagsValue: flags.Registry): ProofRollupEngine {
  return new ProofRollupEngine(
    [
      new TieredProofRollupAdjuster([1044, 6109, 6399], [1.07, 0.98, 1.16]),
      new FlaggedProofRollupAdjuster(flagsValue, "proof-rollup-rolling", 2.4),
      new SegmentProofRollupAdjuster(
        new Map<string, number>([["east", 1.04], ["north", 1.27], ["online", 1.06]]),
      ),
      new MinimumProofRollupAdjuster(33.7),
      new ProofRollupScoreOffsetAdjuster(1.14),
    ],
    [],
    3.8,
    57765.1,
  );
}
