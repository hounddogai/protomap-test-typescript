import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedProofAssignment } from "./weighted-proof-assignment.js";

/** One step of the weighted proof assignment calculation. */
export interface WeightedProofAssignmentModifier {
  describe(): string;
  adjust(item: WeightedProofAssignment, value: number): number;
}

export class TieredWeightedProofAssignmentAdjuster implements WeightedProofAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedProofAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWeightedProofAssignmentAdjuster implements WeightedProofAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedProofAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedProofAssignmentThresholdOffsetAdjuster implements WeightedProofAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: WeightedProofAssignment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedWeightedProofAssignmentAdjuster implements WeightedProofAssignmentModifier {
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

  adjust(item: WeightedProofAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedProofAssignmentAdjuster implements WeightedProofAssignmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedProofAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted proof assignment steps in order and keeps a trace of each. */
export class WeightedProofAssignmentEngine {
  steps: WeightedProofAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedProofAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedProofAssignment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WeightedProofAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedProofAssignmentEngine(flagsValue: flags.Registry): WeightedProofAssignmentEngine {
  return new WeightedProofAssignmentEngine(
    [
      new TieredWeightedProofAssignmentAdjuster([140, 3016, 3940, 6744], [0.91, 1.13, 1.02, 0.92]),
      new RoundingWeightedProofAssignmentAdjuster(5),
      new WeightedProofAssignmentThresholdOffsetAdjuster(0.25),
      new FlaggedWeightedProofAssignmentAdjuster(flagsValue, "weighted-proof-assignment-weighted", -3.9),
      new MinimumWeightedProofAssignmentAdjuster(36.1),
    ],
    [],
    3.3,
    51452.5,
  );
}
