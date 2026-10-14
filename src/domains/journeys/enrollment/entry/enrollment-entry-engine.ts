import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentEntry } from "./enrollment-entry.js";

/** One step of the enrollment entry calculation. */
export interface EnrollmentEntryStep {
  describe(): string;
  adjust(item: EnrollmentEntry, value: number): number;
}

export class EnrollmentEntryCapacityOffsetAdjuster implements EnrollmentEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: EnrollmentEntry, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedEnrollmentEntryAdjuster implements EnrollmentEntryStep {
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

  adjust(item: EnrollmentEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEnrollmentEntryAdjuster implements EnrollmentEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameEnrollmentEntryAdjuster implements EnrollmentEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EnrollmentEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the enrollment entry steps in order and keeps a trace of each. */
export class EnrollmentEntryEngine {
  steps: EnrollmentEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentEntry): number {
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

  evaluateAll(items: EnrollmentEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentEntryEngine(flagsValue: flags.Registry): EnrollmentEntryEngine {
  return new EnrollmentEntryEngine(
    [
      new EnrollmentEntryCapacityOffsetAdjuster(0.68),
      new FlaggedEnrollmentEntryAdjuster(flagsValue, "enrollment-entry-tiered", -8.4),
      new MinimumEnrollmentEntryAdjuster(10.3),
      new NameEnrollmentEntryAdjuster(
        new Map<string, number>([["online", 0.73], ["east", 0.9], ["north", 1.23]]),
      ),
    ],
    [],
    3.8,
    52147.2,
  );
}
