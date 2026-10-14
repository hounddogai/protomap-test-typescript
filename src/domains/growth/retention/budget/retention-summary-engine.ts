import * as flags from "../../../../kit/flags.js";
import { RetentionSummary } from "./retention-summary.js";

/** One step of the retention summary calculation. */
export interface RetentionSummaryModifier {
  describe(): string;
  adjust(item: RetentionSummary, value: number): number;
}

export class MinimumRetentionSummaryAdjuster implements RetentionSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRetentionSummaryAdjuster implements RetentionSummaryModifier {
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

  adjust(item: RetentionSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRetentionSummaryAdjuster implements RetentionSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleRetentionSummaryAdjuster implements RetentionSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RetentionSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the retention summary steps in order and keeps a trace of each. */
export class RetentionSummaryEngine {
  steps: RetentionSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionSummary): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RetentionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionSummaryEngine(flagsValue: flags.Registry): RetentionSummaryEngine {
  return new RetentionSummaryEngine(
    [
      new MinimumRetentionSummaryAdjuster(48.3),
      new FlaggedRetentionSummaryAdjuster(flagsValue, "retention-summary-rolling", -7.9),
      new PercentRetentionSummaryAdjuster(24.6),
      new LocaleRetentionSummaryAdjuster(
        new Map<string, number>([["retail", 1.15], ["south", 1.02], ["east", 1.09]]),
      ),
    ],
    [],
    3.5,
    98521.9,
  );
}
