import * as flags from "../../../../kit/flags.js";
import { LevelSummary } from "./level-summary.js";

/** One step of the level summary calculation. */
export interface LevelSummaryAdjuster {
  describe(): string;
  adjust(item: LevelSummary, value: number): number;
}

export class MinimumLevelSummaryAdjuster implements LevelSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLevelSummaryAdjuster implements LevelSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LevelSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLevelSummaryAdjuster implements LevelSummaryAdjuster {
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

  adjust(item: LevelSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelSummaryAdjuster implements LevelSummaryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level summary steps in order and keeps a trace of each. */
export class LevelSummaryEngine {
  steps: LevelSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelSummary): number {
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

  evaluateAll(items: LevelSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelSummaryEngine(flagsValue: flags.Registry): LevelSummaryEngine {
  return new LevelSummaryEngine(
    [
      new MinimumLevelSummaryAdjuster(39.6),
      new LabelLevelSummaryAdjuster(
        new Map<string, number>([["east", 0.79], ["south", 0.81], ["online", 1.11]]),
      ),
      new FlaggedLevelSummaryAdjuster(flagsValue, "level-summary-scheduled", -3.2),
      new CapLevelSummaryAdjuster(32321),
    ],
    [],
    1.5,
    68662.5,
  );
}
