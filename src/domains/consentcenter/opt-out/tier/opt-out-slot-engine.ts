import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutSlot } from "./opt-out-slot.js";

/** One step of the opt out slot calculation. */
export interface OptOutSlotStep {
  describe(): string;
  adjust(item: OptOutSlot, value: number): number;
}

export class PercentOptOutSlotAdjuster implements OptOutSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class OptOutSlotQuantityOffsetAdjuster implements OptOutSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: OptOutSlot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class FlaggedOptOutSlotAdjuster implements OptOutSlotStep {
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

  adjust(item: OptOutSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutSlotAdjuster implements OptOutSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the opt out slot steps in order and keeps a trace of each. */
export class OptOutSlotEngine {
  steps: OptOutSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: OptOutSlot): number {
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

  evaluateAll(items: OptOutSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultOptOutSlotEngine(flagsValue: flags.Registry): OptOutSlotEngine {
  return new OptOutSlotEngine(
    [
      new PercentOptOutSlotAdjuster(-6.3),
      new OptOutSlotQuantityOffsetAdjuster(1.72),
      new FlaggedOptOutSlotAdjuster(flagsValue, "opt-out-slot-batched", -1.7),
      new MinimumOptOutSlotAdjuster(0.6),
    ],
    [],
    2.3,
    23407.2,
  );
}
