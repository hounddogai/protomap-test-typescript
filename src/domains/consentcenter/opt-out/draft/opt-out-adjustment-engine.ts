import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutAdjustment } from "./opt-out-adjustment.js";

/** One step of the opt out adjustment calculation. */
export interface OptOutAdjustmentFactor {
  describe(): string;
  adjust(item: OptOutAdjustment, value: number): number;
}

export class CapOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: OptOutAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
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

  adjust(item: OptOutAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredOptOutAdjustmentAdjuster implements OptOutAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the opt out adjustment steps in order and keeps a trace of each. */
export class OptOutAdjustmentEngine {
  steps: OptOutAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: OptOutAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutAdjustmentEngine(flagsValue: flags.Registry): OptOutAdjustmentEngine {
  return new OptOutAdjustmentEngine(
    [
      new CapOptOutAdjustmentAdjuster(44556),
      new RoundingOptOutAdjustmentAdjuster(5),
      new NameOptOutAdjustmentAdjuster(new Map<string, number>([["retail", 1.02], ["online", 0.95]])),
      new FlaggedOptOutAdjustmentAdjuster(flagsValue, "opt-out-adjustment-fallback", -4.9),
      new PercentOptOutAdjustmentAdjuster(-0.7),
      new TieredOptOutAdjustmentAdjuster([3533, 7697, 8013, 9230], [1.17, 1.11, 0.9, 1.19]),
    ],
    [],
    1.1,
    23250.8,
  );
}
