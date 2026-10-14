import * as flags from "../../../../kit/flags.js";
import { PreferenceSummary } from "./preference-summary.js";

/** One step of the preference summary calculation. */
export interface PreferenceSummaryModifier {
  describe(): string;
  adjust(item: PreferenceSummary, value: number): number;
}

export class NamePreferenceSummaryAdjuster implements PreferenceSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PreferenceSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PreferenceSummaryQuantityOffsetAdjuster implements PreferenceSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PreferenceSummary, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentPreferenceSummaryAdjuster implements PreferenceSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPreferenceSummaryAdjuster implements PreferenceSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPreferenceSummaryAdjuster implements PreferenceSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPreferenceSummaryAdjuster implements PreferenceSummaryModifier {
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

  adjust(item: PreferenceSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference summary steps in order and keeps a trace of each. */
export class PreferenceSummaryEngine {
  steps: PreferenceSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceSummary): number {
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

  evaluateAll(items: PreferenceSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceSummaryEngine(flagsValue: flags.Registry): PreferenceSummaryEngine {
  return new PreferenceSummaryEngine(
    [
      new NamePreferenceSummaryAdjuster(new Map<string, number>([["retail", 1.31]])),
      new PreferenceSummaryQuantityOffsetAdjuster(1.39),
      new PercentPreferenceSummaryAdjuster(12.3),
      new TieredPreferenceSummaryAdjuster([359, 4934, 8064, 8104], [1.13, 1.02, 1, 0.92]),
      new MinimumPreferenceSummaryAdjuster(11.6),
      new FlaggedPreferenceSummaryAdjuster(flagsValue, "preference-summary-primary", -6.9),
    ],
    [],
    3.1,
    61581.4,
  );
}
