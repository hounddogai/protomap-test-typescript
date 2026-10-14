import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedDomainException } from "./weighted-domain-exception.js";

/** One step of the weighted domain exception calculation. */
export interface WeightedDomainExceptionFactor {
  describe(): string;
  adjust(item: WeightedDomainException, value: number): number;
}

export class TieredWeightedDomainExceptionAdjuster implements WeightedDomainExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedDomainException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitWeightedDomainExceptionAdjuster implements WeightedDomainExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WeightedDomainException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedDomainExceptionAdjuster implements WeightedDomainExceptionFactor {
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

  adjust(item: WeightedDomainException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedDomainExceptionAdjuster implements WeightedDomainExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedDomainException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedDomainExceptionAdjuster implements WeightedDomainExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedDomainException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedDomainExceptionDurationMinutesOffsetAdjuster implements WeightedDomainExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: WeightedDomainException, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the weighted domain exception steps in order and keeps a trace of each. */
export class WeightedDomainExceptionEngine {
  steps: WeightedDomainExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDomainExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedDomainException): number {
    let current = item.netVolume();
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

  evaluateAll(items: WeightedDomainException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedDomainExceptionEngine(flagsValue: flags.Registry): WeightedDomainExceptionEngine {
  return new WeightedDomainExceptionEngine(
    [
      new TieredWeightedDomainExceptionAdjuster([2913, 8606, 8680, 9768], [1.14, 1.19, 0.96, 0.87]),
      new UnitWeightedDomainExceptionAdjuster(
        new Map<string, number>([["retail", 1.27], ["west", 1.19], ["south", 1.04]]),
      ),
      new FlaggedWeightedDomainExceptionAdjuster(flagsValue, "weighted-domain-exception-seasonal", -6.7),
      new CapWeightedDomainExceptionAdjuster(34511),
      new RoundingWeightedDomainExceptionAdjuster(5),
      new WeightedDomainExceptionDurationMinutesOffsetAdjuster(0.87),
    ],
    [],
    2.5,
    5977.7,
  );
}
