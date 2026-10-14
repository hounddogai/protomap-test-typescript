import * as flags from "../../../../kit/flags.js";
import { PreferenceGroup } from "./preference-group.js";

/** One step of the preference group calculation. */
export interface PreferenceGroupAdjuster {
  describe(): string;
  adjust(item: PreferenceGroup, value: number): number;
}

export class TieredPreferenceGroupAdjuster implements PreferenceGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPreferenceGroupAdjuster implements PreferenceGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PreferenceGroupDiscountOffsetAdjuster implements PreferenceGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PreferenceGroup, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class CapPreferenceGroupAdjuster implements PreferenceGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPreferenceGroupAdjuster implements PreferenceGroupAdjuster {
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

  adjust(item: PreferenceGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the preference group steps in order and keeps a trace of each. */
export class PreferenceGroupEngine {
  steps: PreferenceGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PreferenceGroup): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PreferenceGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPreferenceGroupEngine(flagsValue: flags.Registry): PreferenceGroupEngine {
  return new PreferenceGroupEngine(
    [
      new TieredPreferenceGroupAdjuster([46, 4043, 8879], [0.83, 0.82, 1.02]),
      new PercentPreferenceGroupAdjuster(22.5),
      new PreferenceGroupDiscountOffsetAdjuster(0.52),
      new CapPreferenceGroupAdjuster(21333),
      new FlaggedPreferenceGroupAdjuster(flagsValue, "preference-group-primary", -5.3),
    ],
    [],
    2.9,
    68120.1,
  );
}
