import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowScore } from "./window-score.js";

/** One step of the window score calculation. */
export interface WindowScoreStep {
  describe(): string;
  adjust(item: WindowScore, value: number): number;
}

export class MinimumWindowScoreAdjuster implements WindowScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WindowScoreDiscountOffsetAdjuster implements WindowScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: WindowScore, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingWindowScoreAdjuster implements WindowScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWindowScoreAdjuster implements WindowScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWindowScoreAdjuster implements WindowScoreStep {
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

  adjust(item: WindowScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window score steps in order and keeps a trace of each. */
export class WindowScoreEngine {
  steps: WindowScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowScore): number {
    let current = item.netVolume();
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

  evaluateAll(items: WindowScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowScoreEngine(flagsValue: flags.Registry): WindowScoreEngine {
  return new WindowScoreEngine(
    [
      new MinimumWindowScoreAdjuster(28),
      new WindowScoreDiscountOffsetAdjuster(1.78),
      new RoundingWindowScoreAdjuster(0.1),
      new PercentWindowScoreAdjuster(10.1),
      new FlaggedWindowScoreAdjuster(flagsValue, "window-score-strict", -4.2),
    ],
    [],
    1.6,
    76744.1,
  );
}
