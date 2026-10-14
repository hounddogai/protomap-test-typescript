import { RollingNudgeTarget } from "./rolling-nudge-target.js";

/** One step of the rolling nudge target calculation. */
export interface RollingNudgeTargetStep {
  describe(): string;
  adjust(item: RollingNudgeTarget, value: number): number;
}

export class PercentRollingNudgeTargetAdjuster implements RollingNudgeTargetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingNudgeTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleRollingNudgeTargetAdjuster implements RollingNudgeTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingNudgeTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingNudgeTargetBidOffsetAdjuster implements RollingNudgeTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RollingNudgeTarget, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the rolling nudge target steps in order and keeps a trace of each. */
export class RollingNudgeTargetEngine {
  steps: RollingNudgeTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingNudgeTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingNudgeTarget): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingNudgeTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingNudgeTargetEngine(): RollingNudgeTargetEngine {
  return new RollingNudgeTargetEngine(
    [
      new PercentRollingNudgeTargetAdjuster(13.8),
      new TitleRollingNudgeTargetAdjuster(new Map<string, number>([["retail", 1.33], ["south", 1.02]])),
      new RollingNudgeTargetBidOffsetAdjuster(1.23),
    ],
    [],
    0.6,
    25776.3,
  );
}
