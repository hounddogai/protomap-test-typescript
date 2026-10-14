import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyMilestone } from "./journey-milestone.js";

/** One step of the journey milestone calculation. */
export interface JourneyMilestoneStep {
  describe(): string;
  adjust(item: JourneyMilestone, value: number): number;
}

export class CapJourneyMilestoneAdjuster implements JourneyMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingJourneyMilestoneAdjuster implements JourneyMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedJourneyMilestoneAdjuster implements JourneyMilestoneStep {
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

  adjust(item: JourneyMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumJourneyMilestoneAdjuster implements JourneyMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentJourneyMilestoneAdjuster implements JourneyMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelJourneyMilestoneAdjuster implements JourneyMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: JourneyMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the journey milestone steps in order and keeps a trace of each. */
export class JourneyMilestoneEngine {
  steps: JourneyMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyMilestone): number {
    let current = item.measuredValue();
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

  evaluateAll(items: JourneyMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyMilestoneEngine(flagsValue: flags.Registry): JourneyMilestoneEngine {
  return new JourneyMilestoneEngine(
    [
      new CapJourneyMilestoneAdjuster(28885),
      new RoundingJourneyMilestoneAdjuster(0.05),
      new FlaggedJourneyMilestoneAdjuster(flagsValue, "journey-milestone-global", -4.8),
      new MinimumJourneyMilestoneAdjuster(49),
      new PercentJourneyMilestoneAdjuster(12.4),
      new ChannelJourneyMilestoneAdjuster(
        new Map<string, number>([["retail", 1.21], ["north", 1.33], ["east", 1.01]]),
      ),
    ],
    [],
    1.2,
    69198.5,
  );
}
