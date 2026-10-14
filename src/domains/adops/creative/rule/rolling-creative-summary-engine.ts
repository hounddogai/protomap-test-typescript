import * as flags from "../../../../kit/flags.js";
import { RollingCreativeSummary } from "./rolling-creative-summary.js";

/** One step of the rolling creative summary calculation. */
export interface RollingCreativeSummaryFactor {
  describe(): string;
  adjust(item: RollingCreativeSummary, value: number): number;
}

export class RollingCreativeSummaryMinimumOffsetAdjuster implements RollingCreativeSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: RollingCreativeSummary, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TitleRollingCreativeSummaryAdjuster implements RollingCreativeSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingCreativeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingCreativeSummaryAdjuster implements RollingCreativeSummaryFactor {
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

  adjust(item: RollingCreativeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingCreativeSummaryAdjuster implements RollingCreativeSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingCreativeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingCreativeSummaryAdjuster implements RollingCreativeSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingCreativeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling creative summary steps in order and keeps a trace of each. */
export class RollingCreativeSummaryEngine {
  steps: RollingCreativeSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCreativeSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingCreativeSummary): number {
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

  evaluateAll(items: RollingCreativeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingCreativeSummaryEngine(flagsValue: flags.Registry): RollingCreativeSummaryEngine {
  return new RollingCreativeSummaryEngine(
    [
      new RollingCreativeSummaryMinimumOffsetAdjuster(1.93),
      new TitleRollingCreativeSummaryAdjuster(new Map<string, number>([["south", 1]])),
      new FlaggedRollingCreativeSummaryAdjuster(flagsValue, "rolling-creative-summary-fallback", -3.5),
      new CapRollingCreativeSummaryAdjuster(31044),
      new TieredRollingCreativeSummaryAdjuster([4466, 6398, 9768], [0.85, 1.02, 1.18]),
    ],
    [],
    3.9,
    23340.5,
  );
}
