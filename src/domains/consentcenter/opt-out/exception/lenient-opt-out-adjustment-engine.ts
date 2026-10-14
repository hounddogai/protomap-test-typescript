import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientOptOutAdjustment } from "./lenient-opt-out-adjustment.js";

/** One step of the lenient opt out adjustment calculation. */
export interface LenientOptOutAdjustmentAdjuster {
  describe(): string;
  adjust(item: LenientOptOutAdjustment, value: number): number;
}

export class TieredLenientOptOutAdjustmentAdjuster implements LenientOptOutAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientOptOutAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientOptOutAdjustmentAdjuster implements LenientOptOutAdjustmentAdjuster {
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

  adjust(item: LenientOptOutAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientOptOutAdjustmentAdjuster implements LenientOptOutAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientOptOutAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLenientOptOutAdjustmentAdjuster implements LenientOptOutAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientOptOutAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLenientOptOutAdjustmentAdjuster implements LenientOptOutAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientOptOutAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient opt out adjustment steps in order and keeps a trace of each. */
export class LenientOptOutAdjustmentEngine {
  steps: LenientOptOutAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientOptOutAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientOptOutAdjustment): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LenientOptOutAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientOptOutAdjustmentEngine(flagsValue: flags.Registry): LenientOptOutAdjustmentEngine {
  return new LenientOptOutAdjustmentEngine(
    [
      new TieredLenientOptOutAdjustmentAdjuster([2045, 5293, 8569], [0.86, 0.81, 1.03]),
      new FlaggedLenientOptOutAdjustmentAdjuster(flagsValue, "lenient-opt-out-adjustment-legacy", -3.5),
      new RoundingLenientOptOutAdjustmentAdjuster(1),
      new TitleLenientOptOutAdjustmentAdjuster(new Map<string, number>([["online", 1.12]])),
      new CapLenientOptOutAdjustmentAdjuster(5797),
    ],
    [],
    1.6,
    3927.3,
  );
}
