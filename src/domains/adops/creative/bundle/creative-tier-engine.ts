import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeTier } from "./creative-tier.js";

/** One step of the creative tier calculation. */
export interface CreativeTierFactor {
  describe(): string;
  adjust(item: CreativeTier, value: number): number;
}

export class RoundingCreativeTierAdjuster implements CreativeTierFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCreativeTierAdjuster implements CreativeTierFactor {
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

  adjust(item: CreativeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreativeTierAdjuster implements CreativeTierFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreativeTierAdjuster implements CreativeTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCreativeTierAdjuster implements CreativeTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCreativeTierAdjuster implements CreativeTierFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the creative tier steps in order and keeps a trace of each. */
export class CreativeTierEngine {
  steps: CreativeTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: CreativeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeTierEngine(flagsValue: flags.Registry): CreativeTierEngine {
  return new CreativeTierEngine(
    [
      new RoundingCreativeTierAdjuster(0.05),
      new FlaggedCreativeTierAdjuster(flagsValue, "creative-tier-capped", 9.8),
      new TieredCreativeTierAdjuster([504, 4138, 8154], [1.13, 0.96, 0.95]),
      new PercentCreativeTierAdjuster(15),
      new CapCreativeTierAdjuster(21206),
      new MinimumCreativeTierAdjuster(43.1),
    ],
    [],
    4.8,
    33771.6,
  );
}
