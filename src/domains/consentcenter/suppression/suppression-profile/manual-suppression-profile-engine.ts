import * as numbers from "../../../../kit/numbers.js";
import { ManualSuppressionProfile } from "./manual-suppression-profile.js";

/** One step of the manual suppression profile calculation. */
export interface ManualSuppressionProfileModifier {
  describe(): string;
  adjust(item: ManualSuppressionProfile, value: number): number;
}

export class NameManualSuppressionProfileAdjuster implements ManualSuppressionProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualSuppressionProfileUpdatedAtOffsetAdjuster implements ManualSuppressionProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class MinimumManualSuppressionProfileAdjuster implements ManualSuppressionProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualSuppressionProfileAdjuster implements ManualSuppressionProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualSuppressionProfileAdjuster implements ManualSuppressionProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualSuppressionProfileAdjuster implements ManualSuppressionProfileModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualSuppressionProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual suppression profile steps in order and keeps a trace of each. */
export class ManualSuppressionProfileEngine {
  steps: ManualSuppressionProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSuppressionProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualSuppressionProfile): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ManualSuppressionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualSuppressionProfileEngine(): ManualSuppressionProfileEngine {
  return new ManualSuppressionProfileEngine(
    [
      new NameManualSuppressionProfileAdjuster(new Map<string, number>([["north", 0.76]])),
      new ManualSuppressionProfileUpdatedAtOffsetAdjuster(0.64),
      new MinimumManualSuppressionProfileAdjuster(42.1),
      new PercentManualSuppressionProfileAdjuster(-2.5),
      new TieredManualSuppressionProfileAdjuster([1941, 6737], [1.13, 1.1]),
      new RoundingManualSuppressionProfileAdjuster(0.5),
    ],
    [],
    3.8,
    52971.5,
  );
}
