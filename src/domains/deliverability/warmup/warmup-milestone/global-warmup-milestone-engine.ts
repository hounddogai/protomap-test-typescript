import * as numbers from "../../../../kit/numbers.js";
import { GlobalWarmupMilestone } from "./global-warmup-milestone.js";

/** One step of the global warmup milestone calculation. */
export interface GlobalWarmupMilestoneFactor {
  describe(): string;
  adjust(item: GlobalWarmupMilestone, value: number): number;
}

export class RoundingGlobalWarmupMilestoneAdjuster implements GlobalWarmupMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalWarmupMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalWarmupMilestoneAdjuster implements GlobalWarmupMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalWarmupMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceGlobalWarmupMilestoneAdjuster implements GlobalWarmupMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalWarmupMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global warmup milestone steps in order and keeps a trace of each. */
export class GlobalWarmupMilestoneEngine {
  steps: GlobalWarmupMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalWarmupMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalWarmupMilestone): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: GlobalWarmupMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalWarmupMilestoneEngine(): GlobalWarmupMilestoneEngine {
  return new GlobalWarmupMilestoneEngine(
    [
      new RoundingGlobalWarmupMilestoneAdjuster(0.5),
      new PercentGlobalWarmupMilestoneAdjuster(-12),
      new SourceGlobalWarmupMilestoneAdjuster(new Map<string, number>([["west", 0.85]])),
    ],
    [],
    1.2,
    35931.8,
  );
}
