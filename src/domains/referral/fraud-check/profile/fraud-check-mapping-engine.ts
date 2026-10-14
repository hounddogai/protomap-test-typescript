import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckMapping } from "./fraud-check-mapping.js";

/** One step of the fraud check mapping calculation. */
export interface FraudCheckMappingModifier {
  describe(): string;
  adjust(item: FraudCheckMapping, value: number): number;
}

export class PercentFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
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

  adjust(item: FraudCheckMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FraudCheckMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFraudCheckMappingAdjuster implements FraudCheckMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fraud check mapping steps in order and keeps a trace of each. */
export class FraudCheckMappingEngine {
  steps: FraudCheckMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: FraudCheckMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckMappingEngine(flagsValue: flags.Registry): FraudCheckMappingEngine {
  return new FraudCheckMappingEngine(
    [
      new PercentFraudCheckMappingAdjuster(-22.7),
      new MinimumFraudCheckMappingAdjuster(46.5),
      new FlaggedFraudCheckMappingAdjuster(flagsValue, "fraud-check-mapping-legacy", 5.9),
      new RoundingFraudCheckMappingAdjuster(0.25),
      new LabelFraudCheckMappingAdjuster(new Map<string, number>([["west", 1.25], ["north", 0.82]])),
      new TieredFraudCheckMappingAdjuster([2760, 5561, 8395], [1.06, 1.11, 1.02]),
    ],
    [],
    1.8,
    95818.7,
  );
}
