import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveMacroSummary } from "./adaptive-macro-summary.js";

/** One step of the adaptive macro summary calculation. */
export interface AdaptiveMacroSummaryStep {
  describe(): string;
  adjust(item: AdaptiveMacroSummary, value: number): number;
}

export class AdaptiveMacroSummaryCostOffsetAdjuster implements AdaptiveMacroSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: AdaptiveMacroSummary, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class RoundingAdaptiveMacroSummaryAdjuster implements AdaptiveMacroSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveMacroSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptiveMacroSummaryAdjuster implements AdaptiveMacroSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveMacroSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentAdaptiveMacroSummaryAdjuster implements AdaptiveMacroSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: AdaptiveMacroSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentAdaptiveMacroSummaryAdjuster implements AdaptiveMacroSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveMacroSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive macro summary steps in order and keeps a trace of each. */
export class AdaptiveMacroSummaryEngine {
  steps: AdaptiveMacroSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveMacroSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveMacroSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveMacroSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveMacroSummaryEngine(): AdaptiveMacroSummaryEngine {
  return new AdaptiveMacroSummaryEngine(
    [
      new AdaptiveMacroSummaryCostOffsetAdjuster(0.68),
      new RoundingAdaptiveMacroSummaryAdjuster(0.1),
      new MinimumAdaptiveMacroSummaryAdjuster(5.6),
      new SegmentAdaptiveMacroSummaryAdjuster(
        new Map<string, number>([["online", 0.94], ["west", 1.28], ["north", 0.87]]),
      ),
      new PercentAdaptiveMacroSummaryAdjuster(-16.5),
    ],
    [],
    0.8,
    35988.1,
  );
}
