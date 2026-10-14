import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakSlot } from "./streak-slot.js";

/** One step of the streak slot calculation. */
export interface StreakSlotAdjuster {
  describe(): string;
  adjust(item: StreakSlot, value: number): number;
}

export class FlaggedStreakSlotAdjuster implements StreakSlotAdjuster {
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

  adjust(item: StreakSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakSlotAdjuster implements StreakSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionStreakSlotAdjuster implements StreakSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StreakSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak slot steps in order and keeps a trace of each. */
export class StreakSlotEngine {
  steps: StreakSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakSlot): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StreakSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakSlotEngine(flagsValue: flags.Registry): StreakSlotEngine {
  return new StreakSlotEngine(
    [
      new FlaggedStreakSlotAdjuster(flagsValue, "streak-slot-scheduled", 0.2),
      new CapStreakSlotAdjuster(32124),
      new RegionStreakSlotAdjuster(new Map<string, number>([["west", 0.96], ["south", 0.98], ["online", 0.89]])),
    ],
    [],
    2.6,
    69499,
  );
}
