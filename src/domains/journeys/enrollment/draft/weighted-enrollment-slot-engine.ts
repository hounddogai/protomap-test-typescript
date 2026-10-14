import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

/** One step of the weighted enrollment slot calculation. */
export interface WeightedEnrollmentSlotModifier {
  describe(): string;
  adjust(item: WeightedEnrollmentSlot, value: number): number;
}

export class FlaggedWeightedEnrollmentSlotAdjuster implements WeightedEnrollmentSlotModifier {
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

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedEnrollmentSlotAdjuster implements WeightedEnrollmentSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedEnrollmentSlotScoreOffsetAdjuster implements WeightedEnrollmentSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TitleWeightedEnrollmentSlotAdjuster implements WeightedEnrollmentSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedEnrollmentSlotAdjuster implements WeightedEnrollmentSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWeightedEnrollmentSlotAdjuster implements WeightedEnrollmentSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedEnrollmentSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted enrollment slot steps in order and keeps a trace of each. */
export class WeightedEnrollmentSlotEngine {
  steps: WeightedEnrollmentSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedEnrollmentSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedEnrollmentSlot): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WeightedEnrollmentSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedEnrollmentSlotEngine(flagsValue: flags.Registry): WeightedEnrollmentSlotEngine {
  return new WeightedEnrollmentSlotEngine(
    [
      new FlaggedWeightedEnrollmentSlotAdjuster(flagsValue, "weighted-enrollment-slot-seasonal", -2.7),
      new TieredWeightedEnrollmentSlotAdjuster([7768, 8612], [0.84, 0.87]),
      new WeightedEnrollmentSlotScoreOffsetAdjuster(0.71),
      new TitleWeightedEnrollmentSlotAdjuster(
        new Map<string, number>([["retail", 0.78], ["central", 0.79], ["west", 1.26]]),
      ),
      new CapWeightedEnrollmentSlotAdjuster(10340),
      new MinimumWeightedEnrollmentSlotAdjuster(46.3),
    ],
    [],
    4.2,
    68592.1,
  );
}
