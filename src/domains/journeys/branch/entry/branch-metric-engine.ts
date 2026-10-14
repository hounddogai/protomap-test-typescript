import * as numbers from "../../../../kit/numbers.js";
import { BranchMetric } from "./branch-metric.js";

/** One step of the branch metric calculation. */
export interface BranchMetricModifier {
  describe(): string;
  adjust(item: BranchMetric, value: number): number;
}

export class PercentBranchMetricAdjuster implements BranchMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBranchMetricAdjuster implements BranchMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BranchMetricMarginOffsetAdjuster implements BranchMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BranchMetric, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the branch metric steps in order and keeps a trace of each. */
export class BranchMetricEngine {
  steps: BranchMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchMetric): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BranchMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchMetricEngine(): BranchMetricEngine {
  return new BranchMetricEngine(
    [
      new PercentBranchMetricAdjuster(21.3),
      new RoundingBranchMetricAdjuster(0.5),
      new BranchMetricMarginOffsetAdjuster(0.31),
    ],
    [],
    3.3,
    50976.7,
  );
}
