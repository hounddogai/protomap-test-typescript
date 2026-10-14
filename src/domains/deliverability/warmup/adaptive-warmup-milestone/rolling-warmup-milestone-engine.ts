import * as numbers from "../../../../kit/numbers.js";
import { RollingWarmupMilestone } from "./rolling-warmup-milestone.js";

/** One step of the rolling warmup milestone calculation. */
export interface RollingWarmupMilestoneModifier {
  describe(): string;
  adjust(item: RollingWarmupMilestone, value: number): number;
}

export class PercentRollingWarmupMilestoneAdjuster implements RollingWarmupMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWarmupMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RollingWarmupMilestoneConversionRateOffsetAdjuster implements RollingWarmupMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: RollingWarmupMilestone, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class RoundingRollingWarmupMilestoneAdjuster implements RollingWarmupMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWarmupMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling warmup milestone steps in order and keeps a trace of each. */
export class RollingWarmupMilestoneEngine {
  steps: RollingWarmupMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWarmupMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingWarmupMilestone): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RollingWarmupMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingWarmupMilestoneEngine(): RollingWarmupMilestoneEngine {
  return new RollingWarmupMilestoneEngine(
    [
      new PercentRollingWarmupMilestoneAdjuster(-12.9),
      new RollingWarmupMilestoneConversionRateOffsetAdjuster(0.78),
      new RoundingRollingWarmupMilestoneAdjuster(0.25),
    ],
    [],
    3.5,
    20573.2,
  );
}
