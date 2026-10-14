import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedEnrollmentCycle } from "./capped-enrollment-cycle.js";

/** One step of the capped enrollment cycle calculation. */
export interface CappedEnrollmentCycleModifier {
  describe(): string;
  adjust(item: CappedEnrollmentCycle, value: number): number;
}

export class PercentCappedEnrollmentCycleAdjuster implements CappedEnrollmentCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedEnrollmentCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedEnrollmentCycleAdjuster implements CappedEnrollmentCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedEnrollmentCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedEnrollmentCycleAdjuster implements CappedEnrollmentCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedEnrollmentCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedEnrollmentCycleAdjuster implements CappedEnrollmentCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedEnrollmentCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CappedEnrollmentCycleVersionOffsetAdjuster implements CappedEnrollmentCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: CappedEnrollmentCycle, value: number): number {
    return value + item.version * this.weight;
  }
}

export class FlaggedCappedEnrollmentCycleAdjuster implements CappedEnrollmentCycleModifier {
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

  adjust(item: CappedEnrollmentCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped enrollment cycle steps in order and keeps a trace of each. */
export class CappedEnrollmentCycleEngine {
  steps: CappedEnrollmentCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedEnrollmentCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedEnrollmentCycle): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CappedEnrollmentCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedEnrollmentCycleEngine(flagsValue: flags.Registry): CappedEnrollmentCycleEngine {
  return new CappedEnrollmentCycleEngine(
    [
      new PercentCappedEnrollmentCycleAdjuster(13.7),
      new TieredCappedEnrollmentCycleAdjuster([1092, 7358], [1.13, 1.19]),
      new MinimumCappedEnrollmentCycleAdjuster(48.9),
      new RoundingCappedEnrollmentCycleAdjuster(0.05),
      new CappedEnrollmentCycleVersionOffsetAdjuster(1.29),
      new FlaggedCappedEnrollmentCycleAdjuster(flagsValue, "capped-enrollment-cycle-pending", -4.9),
    ],
    [],
    4.6,
    7200.7,
  );
}
