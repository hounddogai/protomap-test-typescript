import * as flags from "../../../../kit/flags.js";
import { WeightedEscalationSummary } from "./weighted-escalation-summary.js";

/** One step of the weighted escalation summary calculation. */
export interface WeightedEscalationSummaryStep {
  describe(): string;
  adjust(item: WeightedEscalationSummary, value: number): number;
}

export class WeightedEscalationSummaryGraceDaysOffsetAdjuster implements WeightedEscalationSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: WeightedEscalationSummary, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumWeightedEscalationSummaryAdjuster implements WeightedEscalationSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedEscalationSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedEscalationSummaryAdjuster implements WeightedEscalationSummaryStep {
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

  adjust(item: WeightedEscalationSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted escalation summary steps in order and keeps a trace of each. */
export class WeightedEscalationSummaryEngine {
  steps: WeightedEscalationSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedEscalationSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedEscalationSummary): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WeightedEscalationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedEscalationSummaryEngine(flagsValue: flags.Registry): WeightedEscalationSummaryEngine {
  return new WeightedEscalationSummaryEngine(
    [
      new WeightedEscalationSummaryGraceDaysOffsetAdjuster(1.93),
      new MinimumWeightedEscalationSummaryAdjuster(5.2),
      new FlaggedWeightedEscalationSummaryAdjuster(flagsValue, "weighted-escalation-summary-fallback", -3.6),
    ],
    [],
    1,
    12334.3,
  );
}
