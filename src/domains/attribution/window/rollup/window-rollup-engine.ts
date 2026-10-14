import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowRollup } from "./window-rollup.js";

/** One step of the window rollup calculation. */
export interface WindowRollupAdjuster {
  describe(): string;
  adjust(item: WindowRollup, value: number): number;
}

export class MinimumWindowRollupAdjuster implements WindowRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WindowRollupMaximumOffsetAdjuster implements WindowRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: WindowRollup, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class FlaggedWindowRollupAdjuster implements WindowRollupAdjuster {
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

  adjust(item: WindowRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWindowRollupAdjuster implements WindowRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WindowRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWindowRollupAdjuster implements WindowRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the window rollup steps in order and keeps a trace of each. */
export class WindowRollupEngine {
  steps: WindowRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WindowRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowRollupEngine(flagsValue: flags.Registry): WindowRollupEngine {
  return new WindowRollupEngine(
    [
      new MinimumWindowRollupAdjuster(4.9),
      new WindowRollupMaximumOffsetAdjuster(1.51),
      new FlaggedWindowRollupAdjuster(flagsValue, "window-rollup-global", 6.1),
      new LabelWindowRollupAdjuster(new Map<string, number>([["south", 1.27], ["retail", 0.85]])),
      new RoundingWindowRollupAdjuster(0.1),
    ],
    [],
    4.2,
    52429.6,
  );
}
