import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowItem } from "./window-item.js";

/** One step of the window item calculation. */
export interface WindowItemStep {
  describe(): string;
  adjust(item: WindowItem, value: number): number;
}

export class TieredWindowItemAdjuster implements WindowItemStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowItem, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWindowItemAdjuster implements WindowItemStep {
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

  adjust(item: WindowItem, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowItemAdjuster implements WindowItemStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowItem, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWindowItemAdjuster implements WindowItemStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowItem, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window item steps in order and keeps a trace of each. */
export class WindowItemEngine {
  steps: WindowItemStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowItemStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowItem): number {
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

  evaluateAll(items: WindowItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowItemEngine(flagsValue: flags.Registry): WindowItemEngine {
  return new WindowItemEngine(
    [
      new TieredWindowItemAdjuster([440, 4705, 6086], [0.82, 0.96, 0.98]),
      new FlaggedWindowItemAdjuster(flagsValue, "window-item-lenient", -8.3),
      new CapWindowItemAdjuster(33837),
      new PercentWindowItemAdjuster(17),
    ],
    [],
    3.5,
    29546.7,
  );
}
