import * as flags from "../../../../kit/flags.js";
import { WeightedCreativeEntry } from "./weighted-creative-entry.js";

/** One step of the weighted creative entry calculation. */
export interface WeightedCreativeEntryAdjuster {
  describe(): string;
  adjust(item: WeightedCreativeEntry, value: number): number;
}

export class WeightedCreativeEntryEndsAtOffsetAdjuster implements WeightedCreativeEntryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: WeightedCreativeEntry, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class UtmSourceWeightedCreativeEntryAdjuster implements WeightedCreativeEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: WeightedCreativeEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedCreativeEntryAdjuster implements WeightedCreativeEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedCreativeEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWeightedCreativeEntryAdjuster implements WeightedCreativeEntryAdjuster {
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

  adjust(item: WeightedCreativeEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedCreativeEntryAdjuster implements WeightedCreativeEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedCreativeEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted creative entry steps in order and keeps a trace of each. */
export class WeightedCreativeEntryEngine {
  steps: WeightedCreativeEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedCreativeEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedCreativeEntry): number {
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

  evaluateAll(items: WeightedCreativeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedCreativeEntryEngine(flagsValue: flags.Registry): WeightedCreativeEntryEngine {
  return new WeightedCreativeEntryEngine(
    [
      new WeightedCreativeEntryEndsAtOffsetAdjuster(0.07),
      new UtmSourceWeightedCreativeEntryAdjuster(
        new Map<string, number>([["central", 0.78], ["south", 0.86], ["online", 1.26]]),
      ),
      new PercentWeightedCreativeEntryAdjuster(1.4),
      new FlaggedWeightedCreativeEntryAdjuster(flagsValue, "weighted-creative-entry-global", 7.5),
      new CapWeightedCreativeEntryAdjuster(9838),
    ],
    [],
    1.8,
    63996.5,
  );
}
