import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalEnrollmentSlot } from "./global-enrollment-slot.js";

/** One step of the global enrollment slot calculation. */
export interface GlobalEnrollmentSlotModifier {
  describe(): string;
  adjust(item: GlobalEnrollmentSlot, value: number): number;
}

export class PercentGlobalEnrollmentSlotAdjuster implements GlobalEnrollmentSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalEnrollmentSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalEnrollmentSlotAdjuster implements GlobalEnrollmentSlotModifier {
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

  adjust(item: GlobalEnrollmentSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalEnrollmentSlotAdjuster implements GlobalEnrollmentSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalEnrollmentSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalEnrollmentSlotBudgetOffsetAdjuster implements GlobalEnrollmentSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: GlobalEnrollmentSlot, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the global enrollment slot steps in order and keeps a trace of each. */
export class GlobalEnrollmentSlotEngine {
  steps: GlobalEnrollmentSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEnrollmentSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalEnrollmentSlot): number {
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

  evaluateAll(items: GlobalEnrollmentSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalEnrollmentSlotEngine(flagsValue: flags.Registry): GlobalEnrollmentSlotEngine {
  return new GlobalEnrollmentSlotEngine(
    [
      new PercentGlobalEnrollmentSlotAdjuster(17.8),
      new FlaggedGlobalEnrollmentSlotAdjuster(flagsValue, "global-enrollment-slot-fallback", -7.9),
      new RoundingGlobalEnrollmentSlotAdjuster(5),
      new GlobalEnrollmentSlotBudgetOffsetAdjuster(0.13),
    ],
    [],
    2.4,
    91238,
  );
}
