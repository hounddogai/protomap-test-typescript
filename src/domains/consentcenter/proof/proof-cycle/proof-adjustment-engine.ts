import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofAdjustment } from "./proof-adjustment.js";

/** One step of the proof adjustment calculation. */
export interface ProofAdjustmentFactor {
  describe(): string;
  adjust(item: ProofAdjustment, value: number): number;
}

export class PercentProofAdjustmentAdjuster implements ProofAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ProofAdjustmentScoreOffsetAdjuster implements ProofAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ProofAdjustment, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedProofAdjustmentAdjuster implements ProofAdjustmentFactor {
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

  adjust(item: ProofAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredProofAdjustmentAdjuster implements ProofAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryProofAdjustmentAdjuster implements ProofAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ProofAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the proof adjustment steps in order and keeps a trace of each. */
export class ProofAdjustmentEngine {
  steps: ProofAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofAdjustment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ProofAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofAdjustmentEngine(flagsValue: flags.Registry): ProofAdjustmentEngine {
  return new ProofAdjustmentEngine(
    [
      new PercentProofAdjustmentAdjuster(-13),
      new ProofAdjustmentScoreOffsetAdjuster(1.97),
      new FlaggedProofAdjustmentAdjuster(flagsValue, "proof-adjustment-adaptive", 4.3),
      new TieredProofAdjustmentAdjuster([1353, 3807, 5690, 7779], [1.11, 1.2, 1.15, 1.15]),
      new CategoryProofAdjustmentAdjuster(new Map<string, number>([["central", 0.95], ["north", 1.21]])),
    ],
    [],
    2.6,
    69960.2,
  );
}
