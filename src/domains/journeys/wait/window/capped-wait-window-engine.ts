import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedWaitWindow } from "./capped-wait-window.js";

/** One step of the capped wait window calculation. */
export interface CappedWaitWindowAdjuster {
  describe(): string;
  adjust(item: CappedWaitWindow, value: number): number;
}

export class CapCappedWaitWindowAdjuster implements CappedWaitWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWaitWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedWaitWindowAdjuster implements CappedWaitWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedWaitWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedWaitWindowAdjuster implements CappedWaitWindowAdjuster {
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

  adjust(item: CappedWaitWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CappedWaitWindowCapacityOffsetAdjuster implements CappedWaitWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: CappedWaitWindow, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class PercentCappedWaitWindowAdjuster implements CappedWaitWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedWaitWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped wait window steps in order and keeps a trace of each. */
export class CappedWaitWindowEngine {
  steps: CappedWaitWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWaitWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedWaitWindow): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: CappedWaitWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedWaitWindowEngine(flagsValue: flags.Registry): CappedWaitWindowEngine {
  return new CappedWaitWindowEngine(
    [
      new CapCappedWaitWindowAdjuster(16078),
      new TieredCappedWaitWindowAdjuster([5532, 6316, 7296, 8681], [1.05, 0.97, 1.19, 0.89]),
      new FlaggedCappedWaitWindowAdjuster(flagsValue, "capped-wait-window-weighted", 3.1),
      new CappedWaitWindowCapacityOffsetAdjuster(1.04),
      new PercentCappedWaitWindowAdjuster(-7.9),
    ],
    [],
    4.5,
    22789.6,
  );
}
