import * as flags from "../../../../kit/flags.js";
import { LegacyTierEntry } from "./legacy-tier-entry.js";

/** One step of the legacy tier entry calculation. */
export interface LegacyTierEntryFactor {
  describe(): string;
  adjust(item: LegacyTierEntry, value: number): number;
}

export class FlaggedLegacyTierEntryAdjuster implements LegacyTierEntryFactor {
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

  adjust(item: LegacyTierEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyTierEntryAdjuster implements LegacyTierEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyTierEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLegacyTierEntryAdjuster implements LegacyTierEntryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyTierEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitLegacyTierEntryAdjuster implements LegacyTierEntryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LegacyTierEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyTierEntryEndsAtOffsetAdjuster implements LegacyTierEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: LegacyTierEntry, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the legacy tier entry steps in order and keeps a trace of each. */
export class LegacyTierEntryEngine {
  steps: LegacyTierEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTierEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyTierEntry): number {
    let current = item.netValue();
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

  evaluateAll(items: LegacyTierEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyTierEntryEngine(flagsValue: flags.Registry): LegacyTierEntryEngine {
  return new LegacyTierEntryEngine(
    [
      new FlaggedLegacyTierEntryAdjuster(flagsValue, "legacy-tier-entry-seasonal", 2.5),
      new MinimumLegacyTierEntryAdjuster(49.2),
      new CapLegacyTierEntryAdjuster(21337),
      new UnitLegacyTierEntryAdjuster(new Map<string, number>([["east", 1.21]])),
      new LegacyTierEntryEndsAtOffsetAdjuster(1.47),
    ],
    [],
    2.2,
    15064.9,
  );
}
