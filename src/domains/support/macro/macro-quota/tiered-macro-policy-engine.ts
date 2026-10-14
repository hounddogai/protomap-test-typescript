import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredMacroPolicy } from "./tiered-macro-policy.js";

/** One step of the tiered macro policy calculation. */
export interface TieredMacroPolicyAdjuster {
  describe(): string;
  adjust(item: TieredMacroPolicy, value: number): number;
}

export class CapTieredMacroPolicyAdjuster implements TieredMacroPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredMacroPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredMacroPolicyAdjuster implements TieredMacroPolicyAdjuster {
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

  adjust(item: TieredMacroPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredMacroPolicyAdjuster implements TieredMacroPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredMacroPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredMacroPolicyAdjuster implements TieredMacroPolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredMacroPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredMacroPolicyAdjuster implements TieredMacroPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredMacroPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered macro policy steps in order and keeps a trace of each. */
export class TieredMacroPolicyEngine {
  steps: TieredMacroPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredMacroPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredMacroPolicy): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredMacroPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredMacroPolicyEngine(flagsValue: flags.Registry): TieredMacroPolicyEngine {
  return new TieredMacroPolicyEngine(
    [
      new CapTieredMacroPolicyAdjuster(27396),
      new FlaggedTieredMacroPolicyAdjuster(flagsValue, "tiered-macro-policy-lenient", -2.8),
      new TieredTieredMacroPolicyAdjuster([3826, 7090], [1, 1.07]),
      new RoundingTieredMacroPolicyAdjuster(0.25),
      new MinimumTieredMacroPolicyAdjuster(43.5),
    ],
    [],
    2.1,
    46847.1,
  );
}
