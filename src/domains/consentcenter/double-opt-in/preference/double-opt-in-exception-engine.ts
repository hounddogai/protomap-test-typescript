import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInException } from "./double-opt-in-exception.js";

/** One step of the double opt in exception calculation. */
export interface DoubleOptInExceptionAdjuster {
  describe(): string;
  adjust(item: DoubleOptInException, value: number): number;
}

export class NameDoubleOptInExceptionAdjuster implements DoubleOptInExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DoubleOptInException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInExceptionAdjuster implements DoubleOptInExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInExceptionAdjuster implements DoubleOptInExceptionAdjuster {
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

  adjust(item: DoubleOptInException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in exception steps in order and keeps a trace of each. */
export class DoubleOptInExceptionEngine {
  steps: DoubleOptInExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DoubleOptInException): number {
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

  evaluateAll(items: DoubleOptInException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDoubleOptInExceptionEngine(flagsValue: flags.Registry): DoubleOptInExceptionEngine {
  return new DoubleOptInExceptionEngine(
    [
      new NameDoubleOptInExceptionAdjuster(
        new Map<string, number>([["east", 1.32], ["north", 1.07], ["online", 1.11]]),
      ),
      new TieredDoubleOptInExceptionAdjuster([653, 7933, 9252], [0.96, 1, 0.94]),
      new FlaggedDoubleOptInExceptionAdjuster(flagsValue, "double-opt-in-exception-default", -9),
    ],
    [],
    3.1,
    32893.7,
  );
}
