import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencySlot } from "./capped-frequency-slot.js";

/** One step of the capped frequency slot calculation. */
export interface CappedFrequencySlotStep {
  describe(): string;
  adjust(item: CappedFrequencySlot, value: number): number;
}

export class TieredCappedFrequencySlotAdjuster implements CappedFrequencySlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFrequencySlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCappedFrequencySlotAdjuster implements CappedFrequencySlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencySlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedFrequencySlotAdjuster implements CappedFrequencySlotStep {
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

  adjust(item: CappedFrequencySlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped frequency slot steps in order and keeps a trace of each. */
export class CappedFrequencySlotEngine {
  steps: CappedFrequencySlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencySlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedFrequencySlot): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CappedFrequencySlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedFrequencySlotEngine(flagsValue: flags.Registry): CappedFrequencySlotEngine {
  return new CappedFrequencySlotEngine(
    [
      new TieredCappedFrequencySlotAdjuster([2377, 3694, 3701, 9563], [1.19, 1.1, 0.88, 0.86]),
      new CapCappedFrequencySlotAdjuster(10472),
      new FlaggedCappedFrequencySlotAdjuster(flagsValue, "capped-frequency-slot-tiered", 5.2),
    ],
    [],
    5,
    90279.6,
  );
}
