import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedReputationException } from "./weighted-reputation-exception.js";

/** One step of the weighted reputation exception calculation. */
export interface WeightedReputationExceptionStep {
  describe(): string;
  adjust(item: WeightedReputationException, value: number): number;
}

export class CapWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReputationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReputationException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
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

  adjust(item: WeightedReputationException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedReputationException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedReputationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedReputationExceptionAdjuster implements WeightedReputationExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedReputationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted reputation exception steps in order and keeps a trace of each. */
export class WeightedReputationExceptionEngine {
  steps: WeightedReputationExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReputationExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedReputationException): number {
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

  evaluateAll(items: WeightedReputationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedReputationExceptionEngine(flagsValue: flags.Registry): WeightedReputationExceptionEngine {
  return new WeightedReputationExceptionEngine(
    [
      new CapWeightedReputationExceptionAdjuster(1730),
      new RoundingWeightedReputationExceptionAdjuster(0.25),
      new FlaggedWeightedReputationExceptionAdjuster(flagsValue, "weighted-reputation-exception-rolling", -3.1),
      new TieredWeightedReputationExceptionAdjuster([1425, 3631, 7521], [1.09, 1.11, 1.04]),
      new LabelWeightedReputationExceptionAdjuster(new Map<string, number>([["south", 0.82], ["east", 1.23]])),
      new PercentWeightedReputationExceptionAdjuster(13.5),
    ],
    [],
    2.7,
    87390.7,
  );
}
