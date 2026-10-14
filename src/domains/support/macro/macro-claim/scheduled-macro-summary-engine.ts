import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMacroSummary } from "./scheduled-macro-summary.js";

/** One step of the scheduled macro summary calculation. */
export interface ScheduledMacroSummaryFactor {
  describe(): string;
  adjust(item: ScheduledMacroSummary, value: number): number;
}

export class ScheduledMacroSummaryScoreOffsetAdjuster implements ScheduledMacroSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledMacroSummary, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentScheduledMacroSummaryAdjuster implements ScheduledMacroSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledMacroSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledMacroSummaryAdjuster implements ScheduledMacroSummaryFactor {
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

  adjust(item: ScheduledMacroSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledMacroSummaryAdjuster implements ScheduledMacroSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledMacroSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledMacroSummaryAdjuster implements ScheduledMacroSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledMacroSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled macro summary steps in order and keeps a trace of each. */
export class ScheduledMacroSummaryEngine {
  steps: ScheduledMacroSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMacroSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledMacroSummary): number {
    let current = item.netValue();
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

  evaluateAll(items: ScheduledMacroSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledMacroSummaryEngine(flagsValue: flags.Registry): ScheduledMacroSummaryEngine {
  return new ScheduledMacroSummaryEngine(
    [
      new ScheduledMacroSummaryScoreOffsetAdjuster(0.03),
      new PercentScheduledMacroSummaryAdjuster(23.8),
      new FlaggedScheduledMacroSummaryAdjuster(flagsValue, "scheduled-macro-summary-batched", 6.5),
      new MinimumScheduledMacroSummaryAdjuster(38.9),
      new RoundingScheduledMacroSummaryAdjuster(1),
    ],
    [],
    3.9,
    39530.8,
  );
}
