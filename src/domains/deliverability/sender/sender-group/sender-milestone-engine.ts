import * as numbers from "../../../../kit/numbers.js";
import { SenderMilestone } from "./sender-milestone.js";

/** One step of the sender milestone calculation. */
export interface SenderMilestoneFactor {
  describe(): string;
  adjust(item: SenderMilestone, value: number): number;
}

export class RoundingSenderMilestoneAdjuster implements SenderMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSenderMilestoneAdjuster implements SenderMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelSenderMilestoneAdjuster implements SenderMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SenderMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSenderMilestoneAdjuster implements SenderMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sender milestone steps in order and keeps a trace of each. */
export class SenderMilestoneEngine {
  steps: SenderMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SenderMilestone): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SenderMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSenderMilestoneEngine(): SenderMilestoneEngine {
  return new SenderMilestoneEngine(
    [
      new RoundingSenderMilestoneAdjuster(0.05),
      new MinimumSenderMilestoneAdjuster(13.8),
      new LabelSenderMilestoneAdjuster(
        new Map<string, number>([["east", 0.84], ["retail", 1.36], ["south", 1.04]]),
      ),
      new PercentSenderMilestoneAdjuster(-24),
    ],
    [],
    4.3,
    23273.2,
  );
}
