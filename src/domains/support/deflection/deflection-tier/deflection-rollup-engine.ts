import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionRollup } from "./deflection-rollup.js";

/** One step of the deflection rollup calculation. */
export interface DeflectionRollupModifier {
  describe(): string;
  adjust(item: DeflectionRollup, value: number): number;
}

export class TieredDeflectionRollupAdjuster implements DeflectionRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDeflectionRollupAdjuster implements DeflectionRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDeflectionRollupAdjuster implements DeflectionRollupModifier {
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

  adjust(item: DeflectionRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the deflection rollup steps in order and keeps a trace of each. */
export class DeflectionRollupEngine {
  steps: DeflectionRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionRollup): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DeflectionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionRollupEngine(flagsValue: flags.Registry): DeflectionRollupEngine {
  return new DeflectionRollupEngine(
    [
      new TieredDeflectionRollupAdjuster([806, 920, 4700, 9015], [0.91, 0.81, 0.88, 0.9]),
      new CapDeflectionRollupAdjuster(7979),
      new FlaggedDeflectionRollupAdjuster(flagsValue, "deflection-rollup-batched", -9.9),
    ],
    [],
    0.7,
    69800.7,
  );
}
