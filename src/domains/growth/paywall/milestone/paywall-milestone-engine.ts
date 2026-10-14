import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallMilestone } from "./paywall-milestone.js";

/** One step of the paywall milestone calculation. */
export interface PaywallMilestoneAdjuster {
  describe(): string;
  adjust(item: PaywallMilestone, value: number): number;
}

export class CapPaywallMilestoneAdjuster implements PaywallMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPaywallMilestoneAdjuster implements PaywallMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPaywallMilestoneAdjuster implements PaywallMilestoneAdjuster {
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

  adjust(item: PaywallMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallMilestoneAdjuster implements PaywallMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitlePaywallMilestoneAdjuster implements PaywallMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PaywallMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the paywall milestone steps in order and keeps a trace of each. */
export class PaywallMilestoneEngine {
  steps: PaywallMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallMilestone): number {
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

  evaluateAll(items: PaywallMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallMilestoneEngine(flagsValue: flags.Registry): PaywallMilestoneEngine {
  return new PaywallMilestoneEngine(
    [
      new CapPaywallMilestoneAdjuster(2719),
      new PercentPaywallMilestoneAdjuster(13.5),
      new FlaggedPaywallMilestoneAdjuster(flagsValue, "paywall-milestone-lenient", 0.8),
      new MinimumPaywallMilestoneAdjuster(43.7),
      new TitlePaywallMilestoneAdjuster(
        new Map<string, number>([["east", 1.22], ["south", 0.76], ["central", 1.25]]),
      ),
    ],
    [],
    2.1,
    73965.2,
  );
}
