import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceException } from "./bounce-exception.js";

/** One step of the bounce exception calculation. */
export interface BounceExceptionModifier {
  describe(): string;
  adjust(item: BounceException, value: number): number;
}

export class FlaggedBounceExceptionAdjuster implements BounceExceptionModifier {
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

  adjust(item: BounceException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBounceExceptionAdjuster implements BounceExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBounceExceptionAdjuster implements BounceExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce exception steps in order and keeps a trace of each. */
export class BounceExceptionEngine {
  steps: BounceExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BounceException): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BounceException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBounceExceptionEngine(flagsValue: flags.Registry): BounceExceptionEngine {
  return new BounceExceptionEngine(
    [
      new FlaggedBounceExceptionAdjuster(flagsValue, "bounce-exception-legacy", -5.4),
      new CapBounceExceptionAdjuster(48653),
      new PercentBounceExceptionAdjuster(24.4),
    ],
    [],
    4.9,
    95464.4,
  );
}
