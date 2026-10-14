import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFlightSlot } from "./scheduled-flight-slot.js";

/** One step of the scheduled flight slot calculation. */
export interface ScheduledFlightSlotFactor {
  describe(): string;
  adjust(item: ScheduledFlightSlot, value: number): number;
}

export class FlaggedScheduledFlightSlotAdjuster implements ScheduledFlightSlotFactor {
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

  adjust(item: ScheduledFlightSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleScheduledFlightSlotAdjuster implements ScheduledFlightSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledFlightSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapScheduledFlightSlotAdjuster implements ScheduledFlightSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFlightSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled flight slot steps in order and keeps a trace of each. */
export class ScheduledFlightSlotEngine {
  steps: ScheduledFlightSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFlightSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledFlightSlot): number {
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

  evaluateAll(items: ScheduledFlightSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledFlightSlotEngine(flagsValue: flags.Registry): ScheduledFlightSlotEngine {
  return new ScheduledFlightSlotEngine(
    [
      new FlaggedScheduledFlightSlotAdjuster(flagsValue, "scheduled-flight-slot-regional", 4.1),
      new LocaleScheduledFlightSlotAdjuster(new Map<string, number>([["online", 1.33], ["retail", 1.23]])),
      new CapScheduledFlightSlotAdjuster(43886),
    ],
    [],
    3,
    15537.5,
  );
}
