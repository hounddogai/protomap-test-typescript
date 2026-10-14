import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalNudgeSummary } from "./regional-nudge-summary.js";

/** One step of the regional nudge summary calculation. */
export interface RegionalNudgeSummaryModifier {
  describe(): string;
  adjust(item: RegionalNudgeSummary, value: number): number;
}

export class FlaggedRegionalNudgeSummaryAdjuster implements RegionalNudgeSummaryModifier {
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

  adjust(item: RegionalNudgeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleRegionalNudgeSummaryAdjuster implements RegionalNudgeSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalNudgeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalNudgeSummaryAdjuster implements RegionalNudgeSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalNudgeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalNudgeSummaryAdjuster implements RegionalNudgeSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalNudgeSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalNudgeSummaryAdjuster implements RegionalNudgeSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalNudgeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionalNudgeSummaryConversionRateOffsetAdjuster implements RegionalNudgeSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: RegionalNudgeSummary, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the regional nudge summary steps in order and keeps a trace of each. */
export class RegionalNudgeSummaryEngine {
  steps: RegionalNudgeSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalNudgeSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalNudgeSummary): number {
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

  evaluateAll(items: RegionalNudgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalNudgeSummaryEngine(flagsValue: flags.Registry): RegionalNudgeSummaryEngine {
  return new RegionalNudgeSummaryEngine(
    [
      new FlaggedRegionalNudgeSummaryAdjuster(flagsValue, "regional-nudge-summary-batched", 9.6),
      new TitleRegionalNudgeSummaryAdjuster(
        new Map<string, number>([["south", 1.14], ["west", 1.25], ["retail", 1.2]]),
      ),
      new CapRegionalNudgeSummaryAdjuster(1605),
      new TieredRegionalNudgeSummaryAdjuster([1513, 4576, 5719, 6324], [1.01, 1.16, 1.06, 0.84]),
      new RoundingRegionalNudgeSummaryAdjuster(1),
      new RegionalNudgeSummaryConversionRateOffsetAdjuster(0.79),
    ],
    [],
    4.5,
    4477,
  );
}
