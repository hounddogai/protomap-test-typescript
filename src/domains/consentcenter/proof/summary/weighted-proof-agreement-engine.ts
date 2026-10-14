import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedProofAgreement } from "./weighted-proof-agreement.js";

/** One step of the weighted proof agreement calculation. */
export interface WeightedProofAgreementAdjuster {
  describe(): string;
  adjust(item: WeightedProofAgreement, value: number): number;
}

export class FlaggedWeightedProofAgreementAdjuster implements WeightedProofAgreementAdjuster {
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

  adjust(item: WeightedProofAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedProofAgreementAdjuster implements WeightedProofAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedProofAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedProofAgreementAdjuster implements WeightedProofAgreementAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedProofAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitWeightedProofAgreementAdjuster implements WeightedProofAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WeightedProofAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedProofAgreementAdjuster implements WeightedProofAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedProofAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted proof agreement steps in order and keeps a trace of each. */
export class WeightedProofAgreementEngine {
  steps: WeightedProofAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedProofAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedProofAgreement): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WeightedProofAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedProofAgreementEngine(flagsValue: flags.Registry): WeightedProofAgreementEngine {
  return new WeightedProofAgreementEngine(
    [
      new FlaggedWeightedProofAgreementAdjuster(flagsValue, "weighted-proof-agreement-default", -3.8),
      new TieredWeightedProofAgreementAdjuster([271, 8215], [0.95, 1.06]),
      new PercentWeightedProofAgreementAdjuster(22.2),
      new UnitWeightedProofAgreementAdjuster(new Map<string, number>([["online", 1.34], ["south", 0.84]])),
      new MinimumWeightedProofAgreementAdjuster(29.7),
    ],
    [],
    2,
    79431,
  );
}
