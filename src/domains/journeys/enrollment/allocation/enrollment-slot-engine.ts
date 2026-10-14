import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentSlot } from "./enrollment-slot.js";

/** One step of the enrollment slot calculation. */
export interface EnrollmentSlotModifier {
  describe(): string;
  adjust(item: EnrollmentSlot, value: number): number;
}

export class EnrollmentSlotSendAtOffsetAdjuster implements EnrollmentSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: EnrollmentSlot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedEnrollmentSlotAdjuster implements EnrollmentSlotModifier {
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

  adjust(item: EnrollmentSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEnrollmentSlotAdjuster implements EnrollmentSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEnrollmentSlotAdjuster implements EnrollmentSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EnrollmentSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the enrollment slot steps in order and keeps a trace of each. */
export class EnrollmentSlotEngine {
  steps: EnrollmentSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EnrollmentSlot): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: EnrollmentSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEnrollmentSlotEngine(flagsValue: flags.Registry): EnrollmentSlotEngine {
  return new EnrollmentSlotEngine(
    [
      new EnrollmentSlotSendAtOffsetAdjuster(1.78),
      new FlaggedEnrollmentSlotAdjuster(flagsValue, "enrollment-slot-weighted", 3.1),
      new MinimumEnrollmentSlotAdjuster(12.5),
      new RoundingEnrollmentSlotAdjuster(0.25),
    ],
    [],
    0.5,
    48217.5,
  );
}
