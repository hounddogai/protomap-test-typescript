import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalOptOutException } from "./global-opt-out-exception.js";

/** One step of the global opt out exception calculation. */
export interface GlobalOptOutExceptionFactor {
  describe(): string;
  adjust(item: GlobalOptOutException, value: number): number;
}

export class PercentGlobalOptOutExceptionAdjuster implements GlobalOptOutExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalOptOutException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleGlobalOptOutExceptionAdjuster implements GlobalOptOutExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalOptOutException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedGlobalOptOutExceptionAdjuster implements GlobalOptOutExceptionFactor {
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

  adjust(item: GlobalOptOutException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalOptOutExceptionAdjuster implements GlobalOptOutExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalOptOutException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalOptOutExceptionLimitOffsetAdjuster implements GlobalOptOutExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: GlobalOptOutException, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingGlobalOptOutExceptionAdjuster implements GlobalOptOutExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalOptOutException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global opt out exception steps in order and keeps a trace of each. */
export class GlobalOptOutExceptionEngine {
  steps: GlobalOptOutExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalOptOutExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalOptOutException): number {
    let current = item.netValue();
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

  evaluateAll(items: GlobalOptOutException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalOptOutExceptionEngine(flagsValue: flags.Registry): GlobalOptOutExceptionEngine {
  return new GlobalOptOutExceptionEngine(
    [
      new PercentGlobalOptOutExceptionAdjuster(-20.2),
      new TitleGlobalOptOutExceptionAdjuster(new Map<string, number>([["central", 1.03], ["north", 0.97]])),
      new FlaggedGlobalOptOutExceptionAdjuster(flagsValue, "global-opt-out-exception-legacy", 9.5),
      new CapGlobalOptOutExceptionAdjuster(9882),
      new GlobalOptOutExceptionLimitOffsetAdjuster(0.54),
      new RoundingGlobalOptOutExceptionAdjuster(5),
    ],
    [],
    0.8,
    9850.4,
  );
}
