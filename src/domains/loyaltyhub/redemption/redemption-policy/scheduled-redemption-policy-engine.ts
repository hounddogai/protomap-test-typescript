import { ScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

/** One step of the scheduled redemption policy calculation. */
export interface ScheduledRedemptionPolicyAdjuster {
  describe(): string;
  adjust(item: ScheduledRedemptionPolicy, value: number): number;
}

export class PercentScheduledRedemptionPolicyAdjuster implements ScheduledRedemptionPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledRedemptionPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledRedemptionPolicyAdjuster implements ScheduledRedemptionPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledRedemptionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledRedemptionPolicyMarginOffsetAdjuster implements ScheduledRedemptionPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ScheduledRedemptionPolicy, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the scheduled redemption policy steps in order and keeps a trace of each. */
export class ScheduledRedemptionPolicyEngine {
  steps: ScheduledRedemptionPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRedemptionPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledRedemptionPolicy): number {
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

  evaluateAll(items: ScheduledRedemptionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledRedemptionPolicyEngine(): ScheduledRedemptionPolicyEngine {
  return new ScheduledRedemptionPolicyEngine(
    [
      new PercentScheduledRedemptionPolicyAdjuster(-3.2),
      new MinimumScheduledRedemptionPolicyAdjuster(31.9),
      new ScheduledRedemptionPolicyMarginOffsetAdjuster(0.73),
    ],
    [],
    1,
    73765,
  );
}
