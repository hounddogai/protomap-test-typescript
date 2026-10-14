import * as flags from "../../../../kit/flags.js";
import { LenientFlightSlot } from "./lenient-flight-slot.js";

/** One step of the lenient flight slot calculation. */
export interface LenientFlightSlotAdjuster {
  describe(): string;
  adjust(item: LenientFlightSlot, value: number): number;
}

export class MinimumLenientFlightSlotAdjuster implements LenientFlightSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFlightSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientFlightSlotAdjuster implements LenientFlightSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFlightSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLenientFlightSlotAdjuster implements LenientFlightSlotAdjuster {
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

  adjust(item: LenientFlightSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient flight slot steps in order and keeps a trace of each. */
export class LenientFlightSlotEngine {
  steps: LenientFlightSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFlightSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientFlightSlot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LenientFlightSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientFlightSlotEngine(flagsValue: flags.Registry): LenientFlightSlotEngine {
  return new LenientFlightSlotEngine(
    [
      new MinimumLenientFlightSlotAdjuster(3.3),
      new CapLenientFlightSlotAdjuster(37487),
      new FlaggedLenientFlightSlotAdjuster(flagsValue, "lenient-flight-slot-global", 3.5),
    ],
    [],
    1.3,
    30131.7,
  );
}
