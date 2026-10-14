import * as flags from "../../../../kit/flags.js";
import { DefaultPaywallMilestone } from "./default-paywall-milestone.js";

/** One step of the default paywall milestone calculation. */
export interface DefaultPaywallMilestoneStep {
  describe(): string;
  adjust(item: DefaultPaywallMilestone, value: number): number;
}

export class CapDefaultPaywallMilestoneAdjuster implements DefaultPaywallMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPaywallMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDefaultPaywallMilestoneAdjuster implements DefaultPaywallMilestoneStep {
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

  adjust(item: DefaultPaywallMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultPaywallMilestoneAdjuster implements DefaultPaywallMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPaywallMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default paywall milestone steps in order and keeps a trace of each. */
export class DefaultPaywallMilestoneEngine {
  steps: DefaultPaywallMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPaywallMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPaywallMilestone): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultPaywallMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPaywallMilestoneEngine(flagsValue: flags.Registry): DefaultPaywallMilestoneEngine {
  return new DefaultPaywallMilestoneEngine(
    [
      new CapDefaultPaywallMilestoneAdjuster(2508),
      new FlaggedDefaultPaywallMilestoneAdjuster(flagsValue, "default-paywall-milestone-seasonal", -4.9),
      new PercentDefaultPaywallMilestoneAdjuster(-13),
    ],
    [],
    2.1,
    23791.9,
  );
}
