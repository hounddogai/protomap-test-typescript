import * as flags from "../../../../kit/flags.js";
import { WaitSlot } from "./wait-slot.js";

/** One step of the wait slot calculation. */
export interface WaitSlotFactor {
  describe(): string;
  adjust(item: WaitSlot, value: number): number;
}

export class PercentWaitSlotAdjuster implements WaitSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredWaitSlotAdjuster implements WaitSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WaitSlotDiscountOffsetAdjuster implements WaitSlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: WaitSlot, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedWaitSlotAdjuster implements WaitSlotFactor {
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

  adjust(item: WaitSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitSlotAdjuster implements WaitSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the wait slot steps in order and keeps a trace of each. */
export class WaitSlotEngine {
  steps: WaitSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitSlot): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: WaitSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitSlotEngine(flagsValue: flags.Registry): WaitSlotEngine {
  return new WaitSlotEngine(
    [
      new PercentWaitSlotAdjuster(13),
      new TieredWaitSlotAdjuster([2597, 3329, 3406, 3958], [0.81, 0.93, 1.14, 0.82]),
      new WaitSlotDiscountOffsetAdjuster(1.21),
      new FlaggedWaitSlotAdjuster(flagsValue, "wait-slot-regional", 9),
      new CapWaitSlotAdjuster(38695),
    ],
    [],
    2.2,
    2437.6,
  );
}
