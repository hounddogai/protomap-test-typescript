import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictOptOutDraft } from "./strict-opt-out-draft.js";

/** One step of the strict opt out draft calculation. */
export interface StrictOptOutDraftStep {
  describe(): string;
  adjust(item: StrictOptOutDraft, value: number): number;
}

export class FlaggedStrictOptOutDraftAdjuster implements StrictOptOutDraftStep {
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

  adjust(item: StrictOptOutDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictOptOutDraftAdjuster implements StrictOptOutDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictOptOutDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StrictOptOutDraftUpdatedAtOffsetAdjuster implements StrictOptOutDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: StrictOptOutDraft, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CategoryStrictOptOutDraftAdjuster implements StrictOptOutDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StrictOptOutDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictOptOutDraftAdjuster implements StrictOptOutDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictOptOutDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictOptOutDraftAdjuster implements StrictOptOutDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictOptOutDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict opt out draft steps in order and keeps a trace of each. */
export class StrictOptOutDraftEngine {
  steps: StrictOptOutDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictOptOutDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictOptOutDraft): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictOptOutDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictOptOutDraftEngine(flagsValue: flags.Registry): StrictOptOutDraftEngine {
  return new StrictOptOutDraftEngine(
    [
      new FlaggedStrictOptOutDraftAdjuster(flagsValue, "strict-opt-out-draft-adaptive", -4.7),
      new MinimumStrictOptOutDraftAdjuster(7.9),
      new StrictOptOutDraftUpdatedAtOffsetAdjuster(1.91),
      new CategoryStrictOptOutDraftAdjuster(new Map<string, number>([["north", 1.08], ["retail", 1.11]])),
      new TieredStrictOptOutDraftAdjuster([1144, 3277, 3509], [0.88, 1.1, 1.09]),
      new CapStrictOptOutDraftAdjuster(39782),
    ],
    [],
    1.9,
    90283.8,
  );
}
