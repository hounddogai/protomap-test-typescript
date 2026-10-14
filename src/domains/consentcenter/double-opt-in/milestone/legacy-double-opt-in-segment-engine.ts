import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

/** One step of the legacy double opt in segment calculation. */
export interface LegacyDoubleOptInSegmentFactor {
  describe(): string;
  adjust(item: LegacyDoubleOptInSegment, value: number): number;
}

export class CapLegacyDoubleOptInSegmentAdjuster implements LegacyDoubleOptInSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDoubleOptInSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyDoubleOptInSegmentAdjuster implements LegacyDoubleOptInSegmentFactor {
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

  adjust(item: LegacyDoubleOptInSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacyDoubleOptInSegmentAdjuster implements LegacyDoubleOptInSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyDoubleOptInSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleLegacyDoubleOptInSegmentAdjuster implements LegacyDoubleOptInSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LegacyDoubleOptInSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyDoubleOptInSegmentAdjuster implements LegacyDoubleOptInSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyDoubleOptInSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy double opt in segment steps in order and keeps a trace of each. */
export class LegacyDoubleOptInSegmentEngine {
  steps: LegacyDoubleOptInSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDoubleOptInSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyDoubleOptInSegment): number {
    let current = item.netLoad();
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

  evaluateAll(items: LegacyDoubleOptInSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyDoubleOptInSegmentEngine(flagsValue: flags.Registry): LegacyDoubleOptInSegmentEngine {
  return new LegacyDoubleOptInSegmentEngine(
    [
      new CapLegacyDoubleOptInSegmentAdjuster(7247),
      new FlaggedLegacyDoubleOptInSegmentAdjuster(flagsValue, "legacy-double-opt-in-segment-rolling", -9.7),
      new PercentLegacyDoubleOptInSegmentAdjuster(1.6),
      new TitleLegacyDoubleOptInSegmentAdjuster(new Map<string, number>([["west", 1.13], ["retail", 1.03]])),
      new TieredLegacyDoubleOptInSegmentAdjuster([1648, 2029, 4591, 6889], [1.07, 0.81, 1.16, 0.82]),
    ],
    [],
    3,
    84247.2,
  );
}
