import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroPolicy } from "./macro-policy.js";

/** One step of the macro policy calculation. */
export interface MacroPolicyFactor {
  describe(): string;
  adjust(item: MacroPolicy, value: number): number;
}

export class FlaggedMacroPolicyAdjuster implements MacroPolicyFactor {
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

  adjust(item: MacroPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredMacroPolicyAdjuster implements MacroPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumMacroPolicyAdjuster implements MacroPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingMacroPolicyAdjuster implements MacroPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MacroPolicyFrequencyCapOffsetAdjuster implements MacroPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: MacroPolicy, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the macro policy steps in order and keeps a trace of each. */
export class MacroPolicyEngine {
  steps: MacroPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MacroPolicy): number {
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

  evaluateAll(items: MacroPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMacroPolicyEngine(flagsValue: flags.Registry): MacroPolicyEngine {
  return new MacroPolicyEngine(
    [
      new FlaggedMacroPolicyAdjuster(flagsValue, "macro-policy-capped", 1.8),
      new TieredMacroPolicyAdjuster([844, 2572, 4787, 8964], [0.95, 0.96, 1, 1.12]),
      new MinimumMacroPolicyAdjuster(18.3),
      new RoundingMacroPolicyAdjuster(1),
      new MacroPolicyFrequencyCapOffsetAdjuster(0.7),
    ],
    [],
    4.2,
    97389.9,
  );
}
