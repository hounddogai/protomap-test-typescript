import * as flags from "../../../../kit/flags.js";
import { LenientRewardException } from "./lenient-reward-exception.js";

/** One step of the lenient reward exception calculation. */
export interface LenientRewardExceptionAdjuster {
  describe(): string;
  adjust(item: LenientRewardException, value: number): number;
}

export class FlaggedLenientRewardExceptionAdjuster implements LenientRewardExceptionAdjuster {
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

  adjust(item: LenientRewardException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientRewardExceptionAdjuster implements LenientRewardExceptionAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelLenientRewardExceptionAdjuster implements LenientRewardExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LenientRewardException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient reward exception steps in order and keeps a trace of each. */
export class LenientRewardExceptionEngine {
  steps: LenientRewardExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientRewardException): number {
    let current = item.netLoad();
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

  evaluateAll(items: LenientRewardException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientRewardExceptionEngine(flagsValue: flags.Registry): LenientRewardExceptionEngine {
  return new LenientRewardExceptionEngine(
    [
      new FlaggedLenientRewardExceptionAdjuster(flagsValue, "lenient-reward-exception-lenient", -5),
      new CapLenientRewardExceptionAdjuster(27178),
      new LabelLenientRewardExceptionAdjuster(new Map<string, number>([["east", 0.96], ["north", 0.99]])),
    ],
    [],
    4.5,
    70599.5,
  );
}
