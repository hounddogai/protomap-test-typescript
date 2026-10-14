import * as flags from "../../../../kit/flags.js";
import { TieredWindowException } from "./tiered-window-exception.js";

/** One step of the tiered window exception calculation. */
export interface TieredWindowExceptionModifier {
  describe(): string;
  adjust(item: TieredWindowException, value: number): number;
}

export class TieredWindowExceptionScoreOffsetAdjuster implements TieredWindowExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TieredWindowException, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedTieredWindowExceptionAdjuster implements TieredWindowExceptionModifier {
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

  adjust(item: TieredWindowException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredWindowExceptionAdjuster implements TieredWindowExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWindowException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered window exception steps in order and keeps a trace of each. */
export class TieredWindowExceptionEngine {
  steps: TieredWindowExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWindowExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredWindowException): number {
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

  evaluateAll(items: TieredWindowException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredWindowExceptionEngine(flagsValue: flags.Registry): TieredWindowExceptionEngine {
  return new TieredWindowExceptionEngine(
    [
      new TieredWindowExceptionScoreOffsetAdjuster(1.77),
      new FlaggedTieredWindowExceptionAdjuster(flagsValue, "tiered-window-exception-adaptive", -2.2),
      new TieredTieredWindowExceptionAdjuster([7686, 9500], [0.93, 0.99]),
    ],
    [],
    1.2,
    80738.1,
  );
}
