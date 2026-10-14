import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedStepEntry } from "./capped-step-entry.js";

/** One step of the capped step entry calculation. */
export interface CappedStepEntryStep {
  describe(): string;
  adjust(item: CappedStepEntry, value: number): number;
}

export class CappedStepEntryQuantityOffsetAdjuster implements CappedStepEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CappedStepEntry, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class PercentCappedStepEntryAdjuster implements CappedStepEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedStepEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedStepEntryAdjuster implements CappedStepEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedStepEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedStepEntryAdjuster implements CappedStepEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedStepEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCappedStepEntryAdjuster implements CappedStepEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedStepEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedStepEntryAdjuster implements CappedStepEntryStep {
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

  adjust(item: CappedStepEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped step entry steps in order and keeps a trace of each. */
export class CappedStepEntryEngine {
  steps: CappedStepEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedStepEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedStepEntry): number {
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

  evaluateAll(items: CappedStepEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedStepEntryEngine(flagsValue: flags.Registry): CappedStepEntryEngine {
  return new CappedStepEntryEngine(
    [
      new CappedStepEntryQuantityOffsetAdjuster(1.07),
      new PercentCappedStepEntryAdjuster(-9.9),
      new RoundingCappedStepEntryAdjuster(0.25),
      new MinimumCappedStepEntryAdjuster(3.1),
      new CapCappedStepEntryAdjuster(39879),
      new FlaggedCappedStepEntryAdjuster(flagsValue, "capped-step-entry-lenient", 3.1),
    ],
    [],
    2.5,
    65324.8,
  );
}
