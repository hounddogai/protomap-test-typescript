import * as flags from "../../../../kit/flags.js";
import { NudgeBaseline } from "./nudge-baseline.js";

/** One step of the nudge baseline calculation. */
export interface NudgeBaselineModifier {
  describe(): string;
  adjust(item: NudgeBaseline, value: number): number;
}

export class TieredNudgeBaselineAdjuster implements NudgeBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedNudgeBaselineAdjuster implements NudgeBaselineModifier {
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

  adjust(item: NudgeBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumNudgeBaselineAdjuster implements NudgeBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentNudgeBaselineAdjuster implements NudgeBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapNudgeBaselineAdjuster implements NudgeBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the nudge baseline steps in order and keeps a trace of each. */
export class NudgeBaselineEngine {
  steps: NudgeBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeBaseline): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: NudgeBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeBaselineEngine(flagsValue: flags.Registry): NudgeBaselineEngine {
  return new NudgeBaselineEngine(
    [
      new TieredNudgeBaselineAdjuster([835, 1607, 1619], [1.07, 1.17, 0.99]),
      new FlaggedNudgeBaselineAdjuster(flagsValue, "nudge-baseline-capped", 6.9),
      new MinimumNudgeBaselineAdjuster(47.4),
      new PercentNudgeBaselineAdjuster(-11.3),
      new CapNudgeBaselineAdjuster(10205),
    ],
    [],
    1.1,
    83410.5,
  );
}
