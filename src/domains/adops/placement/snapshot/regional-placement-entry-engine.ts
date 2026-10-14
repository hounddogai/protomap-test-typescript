import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPlacementEntry } from "./regional-placement-entry.js";

/** One step of the regional placement entry calculation. */
export interface RegionalPlacementEntryModifier {
  describe(): string;
  adjust(item: RegionalPlacementEntry, value: number): number;
}

export class RoundingRegionalPlacementEntryAdjuster implements RegionalPlacementEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPlacementEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleRegionalPlacementEntryAdjuster implements RegionalPlacementEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalPlacementEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalPlacementEntryAdjuster implements RegionalPlacementEntryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPlacementEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalPlacementEntryAdjuster implements RegionalPlacementEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPlacementEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalPlacementEntryAdjuster implements RegionalPlacementEntryModifier {
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

  adjust(item: RegionalPlacementEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalPlacementEntrySendAtOffsetAdjuster implements RegionalPlacementEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: RegionalPlacementEntry, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the regional placement entry steps in order and keeps a trace of each. */
export class RegionalPlacementEntryEngine {
  steps: RegionalPlacementEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPlacementEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalPlacementEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementEntryEngine(flagsValue: flags.Registry): RegionalPlacementEntryEngine {
  return new RegionalPlacementEntryEngine(
    [
      new RoundingRegionalPlacementEntryAdjuster(0.05),
      new TitleRegionalPlacementEntryAdjuster(new Map<string, number>([["retail", 0.83]])),
      new CapRegionalPlacementEntryAdjuster(11848),
      new TieredRegionalPlacementEntryAdjuster([3587, 4407], [0.89, 1.18]),
      new FlaggedRegionalPlacementEntryAdjuster(flagsValue, "regional-placement-entry-lenient", -1.2),
      new RegionalPlacementEntrySendAtOffsetAdjuster(1.72),
    ],
    [],
    1.8,
    23380.5,
  );
}
