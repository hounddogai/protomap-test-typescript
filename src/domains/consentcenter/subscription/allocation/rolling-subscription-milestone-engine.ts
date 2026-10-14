import * as flags from "../../../../kit/flags.js";
import { RollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

/** One step of the rolling subscription milestone calculation. */
export interface RollingSubscriptionMilestoneModifier {
  describe(): string;
  adjust(item: RollingSubscriptionMilestone, value: number): number;
}

export class ChannelRollingSubscriptionMilestoneAdjuster implements RollingSubscriptionMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingSubscriptionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRollingSubscriptionMilestoneAdjuster implements RollingSubscriptionMilestoneModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: RollingSubscriptionMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingSubscriptionMilestoneAdjuster implements RollingSubscriptionMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingSubscriptionMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRollingSubscriptionMilestoneAdjuster implements RollingSubscriptionMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingSubscriptionMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingSubscriptionMilestoneAdjuster implements RollingSubscriptionMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingSubscriptionMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling subscription milestone steps in order and keeps a trace of each. */
export class RollingSubscriptionMilestoneEngine {
  steps: RollingSubscriptionMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSubscriptionMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingSubscriptionMilestone): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RollingSubscriptionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingSubscriptionMilestoneEngine(flagsValue: flags.Registry): RollingSubscriptionMilestoneEngine {
  return new RollingSubscriptionMilestoneEngine(
    [
      new ChannelRollingSubscriptionMilestoneAdjuster(
        new Map<string, number>([["north", 0.96], ["central", 1.3]]),
      ),
      new FlaggedRollingSubscriptionMilestoneAdjuster(flagsValue, "rolling-subscription-milestone-manual", 2.2),
      new TieredRollingSubscriptionMilestoneAdjuster([1240, 4460, 8753], [1.07, 1.13, 0.91]),
      new MinimumRollingSubscriptionMilestoneAdjuster(11.2),
      new PercentRollingSubscriptionMilestoneAdjuster(9.4),
    ],
    [],
    3.9,
    23479.7,
  );
}
