import * as numbers from "../../../../kit/numbers.js";
import { DefaultWarmupEstimate } from "./default-warmup-estimate.js";

/** One step of the default warmup estimate calculation. */
export interface DefaultWarmupEstimateModifier {
  describe(): string;
  adjust(item: DefaultWarmupEstimate, value: number): number;
}

export class DefaultWarmupEstimateBidOffsetAdjuster implements DefaultWarmupEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: DefaultWarmupEstimate, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentDefaultWarmupEstimateAdjuster implements DefaultWarmupEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultWarmupEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultWarmupEstimateAdjuster implements DefaultWarmupEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultWarmupEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default warmup estimate steps in order and keeps a trace of each. */
export class DefaultWarmupEstimateEngine {
  steps: DefaultWarmupEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWarmupEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultWarmupEstimate): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: DefaultWarmupEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultWarmupEstimateEngine(): DefaultWarmupEstimateEngine {
  return new DefaultWarmupEstimateEngine(
    [
      new DefaultWarmupEstimateBidOffsetAdjuster(1.06),
      new PercentDefaultWarmupEstimateAdjuster(-2.5),
      new RoundingDefaultWarmupEstimateAdjuster(0.05),
    ],
    [],
    0.4,
    35074.2,
  );
}
