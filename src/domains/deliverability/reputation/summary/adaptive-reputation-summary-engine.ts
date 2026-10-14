import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

/** One step of the adaptive reputation summary calculation. */
export interface AdaptiveReputationSummaryFactor {
  describe(): string;
  adjust(item: AdaptiveReputationSummary, value: number): number;
}

export class RoundingAdaptiveReputationSummaryAdjuster implements AdaptiveReputationSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveReputationSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleAdaptiveReputationSummaryAdjuster implements AdaptiveReputationSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveReputationSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveReputationSummaryScoreOffsetAdjuster implements AdaptiveReputationSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: AdaptiveReputationSummary, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentAdaptiveReputationSummaryAdjuster implements AdaptiveReputationSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveReputationSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive reputation summary steps in order and keeps a trace of each. */
export class AdaptiveReputationSummaryEngine {
  steps: AdaptiveReputationSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveReputationSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveReputationSummary): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: AdaptiveReputationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveReputationSummaryEngine(): AdaptiveReputationSummaryEngine {
  return new AdaptiveReputationSummaryEngine(
    [
      new RoundingAdaptiveReputationSummaryAdjuster(0.05),
      new LocaleAdaptiveReputationSummaryAdjuster(new Map<string, number>([["retail", 0.92], ["north", 1.29]])),
      new AdaptiveReputationSummaryScoreOffsetAdjuster(0.98),
      new PercentAdaptiveReputationSummaryAdjuster(11.8),
    ],
    [],
    4,
    32890.3,
  );
}
