import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedProofRollup } from "./weighted-proof-rollup.js";

/** One step of the weighted proof rollup calculation. */
export interface WeightedProofRollupModifier {
  describe(): string;
  adjust(item: WeightedProofRollup, value: number): number;
}

export class TieredWeightedProofRollupAdjuster implements WeightedProofRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedProofRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitWeightedProofRollupAdjuster implements WeightedProofRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WeightedProofRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedProofRollupAdjuster implements WeightedProofRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedProofRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedProofRollupAdjuster implements WeightedProofRollupModifier {
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

  adjust(item: WeightedProofRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWeightedProofRollupAdjuster implements WeightedProofRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedProofRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted proof rollup steps in order and keeps a trace of each. */
export class WeightedProofRollupEngine {
  steps: WeightedProofRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedProofRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedProofRollup): number {
    let current = item.netVolume();
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

  evaluateAll(items: WeightedProofRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedProofRollupEngine(flagsValue: flags.Registry): WeightedProofRollupEngine {
  return new WeightedProofRollupEngine(
    [
      new TieredWeightedProofRollupAdjuster([4247, 4616, 4812, 8205], [0.97, 1.2, 1.18, 0.83]),
      new UnitWeightedProofRollupAdjuster(new Map<string, number>([["retail", 0.7]])),
      new MinimumWeightedProofRollupAdjuster(44.4),
      new FlaggedWeightedProofRollupAdjuster(flagsValue, "weighted-proof-rollup-default", -1.7),
      new PercentWeightedProofRollupAdjuster(-11.8),
    ],
    [],
    3.4,
    30737.2,
  );
}
