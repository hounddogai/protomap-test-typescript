import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionSlot } from "./suppression-slot.js";

/** One step of the suppression slot calculation. */
export interface SuppressionSlotModifier {
  describe(): string;
  adjust(item: SuppressionSlot, value: number): number;
}

export class PercentSuppressionSlotAdjuster implements SuppressionSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSuppressionSlotAdjuster implements SuppressionSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSuppressionSlotAdjuster implements SuppressionSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSuppressionSlotAdjuster implements SuppressionSlotModifier {
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

  adjust(item: SuppressionSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelSuppressionSlotAdjuster implements SuppressionSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SuppressionSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the suppression slot steps in order and keeps a trace of each. */
export class SuppressionSlotEngine {
  steps: SuppressionSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionSlot): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SuppressionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionSlotEngine(flagsValue: flags.Registry): SuppressionSlotEngine {
  return new SuppressionSlotEngine(
    [
      new PercentSuppressionSlotAdjuster(1.5),
      new CapSuppressionSlotAdjuster(45455),
      new MinimumSuppressionSlotAdjuster(34),
      new FlaggedSuppressionSlotAdjuster(flagsValue, "suppression-slot-manual", 6.9),
      new LabelSuppressionSlotAdjuster(new Map<string, number>([["north", 1.02], ["south", 0.75]])),
    ],
    [],
    5,
    18839.5,
  );
}
