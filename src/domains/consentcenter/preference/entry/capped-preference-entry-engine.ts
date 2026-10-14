import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedPreferenceEntry } from "./capped-preference-entry.js";

/** One step of the capped preference entry calculation. */
export interface CappedPreferenceEntryAdjuster {
  describe(): string;
  adjust(item: CappedPreferenceEntry, value: number): number;
}

export class RoundingCappedPreferenceEntryAdjuster implements CappedPreferenceEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPreferenceEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedPreferenceEntryAdjuster implements CappedPreferenceEntryAdjuster {
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

  adjust(item: CappedPreferenceEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedPreferenceEntryAdjuster implements CappedPreferenceEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPreferenceEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelCappedPreferenceEntryAdjuster implements CappedPreferenceEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedPreferenceEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedPreferenceEntryAdjuster implements CappedPreferenceEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPreferenceEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedPreferenceEntryRevisionOffsetAdjuster implements CappedPreferenceEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: CappedPreferenceEntry, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the capped preference entry steps in order and keeps a trace of each. */
export class CappedPreferenceEntryEngine {
  steps: CappedPreferenceEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPreferenceEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedPreferenceEntry): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: CappedPreferenceEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedPreferenceEntryEngine(flagsValue: flags.Registry): CappedPreferenceEntryEngine {
  return new CappedPreferenceEntryEngine(
    [
      new RoundingCappedPreferenceEntryAdjuster(5),
      new FlaggedCappedPreferenceEntryAdjuster(flagsValue, "capped-preference-entry-adaptive", 0.4),
      new TieredCappedPreferenceEntryAdjuster([5228, 7807], [0.89, 1.01]),
      new LabelCappedPreferenceEntryAdjuster(new Map<string, number>([["north", 1.35], ["retail", 0.92]])),
      new PercentCappedPreferenceEntryAdjuster(-8.2),
      new CappedPreferenceEntryRevisionOffsetAdjuster(0.19),
    ],
    [],
    3.1,
    79965.7,
  );
}
