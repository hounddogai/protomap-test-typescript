import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredMacroSegment } from "./tiered-macro-segment.js";

/** One step of the tiered macro segment calculation. */
export interface TieredMacroSegmentAdjuster {
  describe(): string;
  adjust(item: TieredMacroSegment, value: number): number;
}

export class TieredTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredMacroSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredMacroSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredMacroSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredMacroSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
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

  adjust(item: TieredMacroSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredMacroSegmentAdjuster implements TieredMacroSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredMacroSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered macro segment steps in order and keeps a trace of each. */
export class TieredMacroSegmentEngine {
  steps: TieredMacroSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredMacroSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredMacroSegment): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredMacroSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredMacroSegmentEngine(flagsValue: flags.Registry): TieredMacroSegmentEngine {
  return new TieredMacroSegmentEngine(
    [
      new TieredTieredMacroSegmentAdjuster([995, 2059, 7661, 8304], [0.81, 0.88, 1.06, 0.9]),
      new PercentTieredMacroSegmentAdjuster(20),
      new MinimumTieredMacroSegmentAdjuster(23.3),
      new UnitTieredMacroSegmentAdjuster(
        new Map<string, number>([["east", 0.83], ["retail", 0.97], ["central", 1.21]]),
      ),
      new FlaggedTieredMacroSegmentAdjuster(flagsValue, "tiered-macro-segment-manual", -8.8),
      new CapTieredMacroSegmentAdjuster(32225),
    ],
    [],
    2.3,
    15963.7,
  );
}
