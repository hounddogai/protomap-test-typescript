import * as flags from "../../../../kit/flags.js";
import { CsatSlot } from "./csat-slot.js";

/** One step of the csat slot calculation. */
export interface CsatSlotStep {
  describe(): string;
  adjust(item: CsatSlot, value: number): number;
}

export class FlaggedCsatSlotAdjuster implements CsatSlotStep {
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

  adjust(item: CsatSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCsatSlotAdjuster implements CsatSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCsatSlotAdjuster implements CsatSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCsatSlotAdjuster implements CsatSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the csat slot steps in order and keeps a trace of each. */
export class CsatSlotEngine {
  steps: CsatSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatSlot): number {
    let current = item.netValue();
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

  evaluateAll(items: CsatSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatSlotEngine(flagsValue: flags.Registry): CsatSlotEngine {
  return new CsatSlotEngine(
    [
      new FlaggedCsatSlotAdjuster(flagsValue, "csat-slot-primary", -5.8),
      new TieredCsatSlotAdjuster([2531, 5616, 7932, 8654], [1.03, 1.03, 0.84, 1.07]),
      new CapCsatSlotAdjuster(24176),
      new MinimumCsatSlotAdjuster(2.1),
    ],
    [],
    4.8,
    65797.8,
  );
}
