import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostMilestone } from "./post-milestone.js";

/** One step of the post milestone calculation. */
export interface PostMilestoneStep {
  describe(): string;
  adjust(item: PostMilestone, value: number): number;
}

export class FlaggedPostMilestoneAdjuster implements PostMilestoneStep {
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

  adjust(item: PostMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NamePostMilestoneAdjuster implements PostMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PostMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PostMilestoneRetriesOffsetAdjuster implements PostMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PostMilestone, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapPostMilestoneAdjuster implements PostMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPostMilestoneAdjuster implements PostMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the post milestone steps in order and keeps a trace of each. */
export class PostMilestoneEngine {
  steps: PostMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostMilestone): number {
    let current = item.netLoad();
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

  evaluateAll(items: PostMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostMilestoneEngine(flagsValue: flags.Registry): PostMilestoneEngine {
  return new PostMilestoneEngine(
    [
      new FlaggedPostMilestoneAdjuster(flagsValue, "post-milestone-regional", -7.7),
      new NamePostMilestoneAdjuster(
        new Map<string, number>([["south", 1.09], ["online", 1.16], ["east", 0.87]]),
      ),
      new PostMilestoneRetriesOffsetAdjuster(1.32),
      new CapPostMilestoneAdjuster(12733),
      new RoundingPostMilestoneAdjuster(0.05),
    ],
    [],
    4.1,
    1822.4,
  );
}
