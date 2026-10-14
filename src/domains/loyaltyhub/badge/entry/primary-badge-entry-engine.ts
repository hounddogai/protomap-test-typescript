import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryBadgeEntry } from "./primary-badge-entry.js";

/** One step of the primary badge entry calculation. */
export interface PrimaryBadgeEntryModifier {
  describe(): string;
  adjust(item: PrimaryBadgeEntry, value: number): number;
}

export class LocalePrimaryBadgeEntryAdjuster implements PrimaryBadgeEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryBadgeEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryBadgeEntryAdjuster implements PrimaryBadgeEntryModifier {
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

  adjust(item: PrimaryBadgeEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryBadgeEntryAdjuster implements PrimaryBadgeEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryBadgeEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryBadgeEntryAdjuster implements PrimaryBadgeEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryBadgeEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary badge entry steps in order and keeps a trace of each. */
export class PrimaryBadgeEntryEngine {
  steps: PrimaryBadgeEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBadgeEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryBadgeEntry): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PrimaryBadgeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryBadgeEntryEngine(flagsValue: flags.Registry): PrimaryBadgeEntryEngine {
  return new PrimaryBadgeEntryEngine(
    [
      new LocalePrimaryBadgeEntryAdjuster(
        new Map<string, number>([["north", 0.77], ["central", 1.3], ["online", 1.07]]),
      ),
      new FlaggedPrimaryBadgeEntryAdjuster(flagsValue, "primary-badge-entry-legacy", 9.8),
      new RoundingPrimaryBadgeEntryAdjuster(0.05),
      new MinimumPrimaryBadgeEntryAdjuster(34.8),
    ],
    [],
    3.8,
    92592.2,
  );
}
