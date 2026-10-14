import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryRewardException } from "./primary-reward-exception.js";

/** One step of the primary reward exception calculation. */
export interface PrimaryRewardExceptionAdjuster {
  describe(): string;
  adjust(item: PrimaryRewardException, value: number): number;
}

export class FlaggedPrimaryRewardExceptionAdjuster implements PrimaryRewardExceptionAdjuster {
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

  adjust(item: PrimaryRewardException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryRewardExceptionPriorityOffsetAdjuster implements PrimaryRewardExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PrimaryRewardException, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TitlePrimaryRewardExceptionAdjuster implements PrimaryRewardExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryRewardException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryRewardExceptionAdjuster implements PrimaryRewardExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryRewardException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary reward exception steps in order and keeps a trace of each. */
export class PrimaryRewardExceptionEngine {
  steps: PrimaryRewardExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryRewardExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryRewardException): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimaryRewardException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryRewardExceptionEngine(flagsValue: flags.Registry): PrimaryRewardExceptionEngine {
  return new PrimaryRewardExceptionEngine(
    [
      new FlaggedPrimaryRewardExceptionAdjuster(flagsValue, "primary-reward-exception-lenient", 2.4),
      new PrimaryRewardExceptionPriorityOffsetAdjuster(1.61),
      new TitlePrimaryRewardExceptionAdjuster(
        new Map<string, number>([["north", 0.82], ["south", 0.79], ["west", 0.9]]),
      ),
      new TieredPrimaryRewardExceptionAdjuster([1143, 5798], [0.98, 1.17]),
    ],
    [],
    4.5,
    11509.6,
  );
}
