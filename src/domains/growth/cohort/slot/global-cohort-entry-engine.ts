import * as flags from "../../../../kit/flags.js";
import { GlobalCohortEntry } from "./global-cohort-entry.js";

/** One step of the global cohort entry calculation. */
export interface GlobalCohortEntryAdjuster {
  describe(): string;
  adjust(item: GlobalCohortEntry, value: number): number;
}

export class FlaggedGlobalCohortEntryAdjuster implements GlobalCohortEntryAdjuster {
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

  adjust(item: GlobalCohortEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalCohortEntryCostOffsetAdjuster implements GlobalCohortEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: GlobalCohortEntry, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class PercentGlobalCohortEntryAdjuster implements GlobalCohortEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCohortEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalCohortEntryAdjuster implements GlobalCohortEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalCohortEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameGlobalCohortEntryAdjuster implements GlobalCohortEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalCohortEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global cohort entry steps in order and keeps a trace of each. */
export class GlobalCohortEntryEngine {
  steps: GlobalCohortEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCohortEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalCohortEntry): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: GlobalCohortEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalCohortEntryEngine(flagsValue: flags.Registry): GlobalCohortEntryEngine {
  return new GlobalCohortEntryEngine(
    [
      new FlaggedGlobalCohortEntryAdjuster(flagsValue, "global-cohort-entry-weighted", -6.6),
      new GlobalCohortEntryCostOffsetAdjuster(0.32),
      new PercentGlobalCohortEntryAdjuster(5.3),
      new TieredGlobalCohortEntryAdjuster([1289, 6392, 7324, 8038], [0.82, 0.86, 1.1, 1]),
      new NameGlobalCohortEntryAdjuster(new Map<string, number>([["south", 1.21]])),
    ],
    [],
    3.2,
    26019.1,
  );
}
