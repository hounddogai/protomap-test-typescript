import * as flags from "../../../../kit/flags.js";
import { InsightAdjustment } from "./insight-adjustment.js";

/** One step of the insight adjustment calculation. */
export interface InsightAdjustmentModifier {
  describe(): string;
  adjust(item: InsightAdjustment, value: number): number;
}

export class CapInsightAdjustmentAdjuster implements InsightAdjustmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedInsightAdjustmentAdjuster implements InsightAdjustmentModifier {
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

  adjust(item: InsightAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInsightAdjustmentAdjuster implements InsightAdjustmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the insight adjustment steps in order and keeps a trace of each. */
export class InsightAdjustmentEngine {
  steps: InsightAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightAdjustment): number {
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

  evaluateAll(items: InsightAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightAdjustmentEngine(flagsValue: flags.Registry): InsightAdjustmentEngine {
  return new InsightAdjustmentEngine(
    [
      new CapInsightAdjustmentAdjuster(24836),
      new FlaggedInsightAdjustmentAdjuster(flagsValue, "insight-adjustment-global", 7.1),
      new MinimumInsightAdjustmentAdjuster(35.1),
    ],
    [],
    3.2,
    72793.1,
  );
}
