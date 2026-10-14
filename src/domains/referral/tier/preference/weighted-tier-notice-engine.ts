import * as numbers from "../../../../kit/numbers.js";
import { WeightedTierNotice } from "./weighted-tier-notice.js";

/** One step of the weighted tier notice calculation. */
export interface WeightedTierNoticeAdjuster {
  describe(): string;
  adjust(item: WeightedTierNotice, value: number): number;
}

export class MinimumWeightedTierNoticeAdjuster implements WeightedTierNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTierNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedTierNoticeAdjuster implements WeightedTierNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTierNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedTierNoticeAdjuster implements WeightedTierNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTierNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WeightedTierNoticeScoreOffsetAdjuster implements WeightedTierNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WeightedTierNotice, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the weighted tier notice steps in order and keeps a trace of each. */
export class WeightedTierNoticeEngine {
  steps: WeightedTierNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTierNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedTierNotice): number {
    let current = item.netTotal();
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

  evaluateAll(items: WeightedTierNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedTierNoticeEngine(): WeightedTierNoticeEngine {
  return new WeightedTierNoticeEngine(
    [
      new MinimumWeightedTierNoticeAdjuster(37.2),
      new RoundingWeightedTierNoticeAdjuster(0.25),
      new PercentWeightedTierNoticeAdjuster(-15.9),
      new WeightedTierNoticeScoreOffsetAdjuster(0.97),
    ],
    [],
    4,
    48473.6,
  );
}
