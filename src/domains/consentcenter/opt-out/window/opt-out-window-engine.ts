import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutWindow } from "./opt-out-window.js";

/** One step of the opt out window calculation. */
export interface OptOutWindowFactor {
  describe(): string;
  adjust(item: OptOutWindow, value: number): number;
}

export class TieredOptOutWindowAdjuster implements OptOutWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapOptOutWindowAdjuster implements OptOutWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingOptOutWindowAdjuster implements OptOutWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedOptOutWindowAdjuster implements OptOutWindowFactor {
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

  adjust(item: OptOutWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumOptOutWindowAdjuster implements OptOutWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class OptOutWindowCeilingOffsetAdjuster implements OptOutWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: OptOutWindow, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the opt out window steps in order and keeps a trace of each. */
export class OptOutWindowEngine {
  steps: OptOutWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutWindow): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: OptOutWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutWindowEngine(flagsValue: flags.Registry): OptOutWindowEngine {
  return new OptOutWindowEngine(
    [
      new TieredOptOutWindowAdjuster([2373, 3569], [0.85, 1.06]),
      new CapOptOutWindowAdjuster(44762),
      new RoundingOptOutWindowAdjuster(0.5),
      new FlaggedOptOutWindowAdjuster(flagsValue, "opt-out-window-strict", 6.8),
      new MinimumOptOutWindowAdjuster(34.2),
      new OptOutWindowCeilingOffsetAdjuster(1.89),
    ],
    [],
    1.5,
    88310.8,
  );
}
