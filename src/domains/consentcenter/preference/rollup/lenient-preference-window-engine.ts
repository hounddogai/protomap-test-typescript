import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPreferenceWindow } from "./lenient-preference-window.js";

/** One step of the lenient preference window calculation. */
export interface LenientPreferenceWindowStep {
  describe(): string;
  adjust(item: LenientPreferenceWindow, value: number): number;
}

export class TieredLenientPreferenceWindowAdjuster implements LenientPreferenceWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPreferenceWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceLenientPreferenceWindowAdjuster implements LenientPreferenceWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: LenientPreferenceWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientPreferenceWindowAdjuster implements LenientPreferenceWindowStep {
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

  adjust(item: LenientPreferenceWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientPreferenceWindowAdjuster implements LenientPreferenceWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPreferenceWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientPreferenceWindowAdjuster implements LenientPreferenceWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPreferenceWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient preference window steps in order and keeps a trace of each. */
export class LenientPreferenceWindowEngine {
  steps: LenientPreferenceWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPreferenceWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientPreferenceWindow): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LenientPreferenceWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientPreferenceWindowEngine(flagsValue: flags.Registry): LenientPreferenceWindowEngine {
  return new LenientPreferenceWindowEngine(
    [
      new TieredLenientPreferenceWindowAdjuster([5493, 5590], [0.87, 0.98]),
      new UtmSourceLenientPreferenceWindowAdjuster(new Map<string, number>([["central", 1], ["south", 0.71]])),
      new FlaggedLenientPreferenceWindowAdjuster(flagsValue, "lenient-preference-window-lenient", -2.7),
      new CapLenientPreferenceWindowAdjuster(29472),
      new MinimumLenientPreferenceWindowAdjuster(13.3),
    ],
    [],
    3,
    47163.3,
  );
}
