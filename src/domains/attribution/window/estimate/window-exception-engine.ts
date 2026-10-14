import * as flags from "../../../../kit/flags.js";
import { WindowException } from "./window-exception.js";

/** One step of the window exception calculation. */
export interface WindowExceptionFactor {
  describe(): string;
  adjust(item: WindowException, value: number): number;
}

export class TieredWindowExceptionAdjuster implements WindowExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleWindowExceptionAdjuster implements WindowExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WindowException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWindowExceptionAdjuster implements WindowExceptionFactor {
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

  adjust(item: WindowException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowExceptionAdjuster implements WindowExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumWindowExceptionAdjuster implements WindowExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the window exception steps in order and keeps a trace of each. */
export class WindowExceptionEngine {
  steps: WindowExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowException): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WindowException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowExceptionEngine(flagsValue: flags.Registry): WindowExceptionEngine {
  return new WindowExceptionEngine(
    [
      new TieredWindowExceptionAdjuster([404, 2391, 8931], [1.17, 0.82, 0.81]),
      new LocaleWindowExceptionAdjuster(new Map<string, number>([["east", 1.09], ["north", 1.01]])),
      new FlaggedWindowExceptionAdjuster(flagsValue, "window-exception-lenient", -3),
      new CapWindowExceptionAdjuster(3443),
      new MinimumWindowExceptionAdjuster(36.5),
    ],
    [],
    4.4,
    80791,
  );
}
