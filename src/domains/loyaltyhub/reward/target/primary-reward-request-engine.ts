import * as flags from "../../../../kit/flags.js";
import { PrimaryRewardRequest } from "./primary-reward-request.js";

/** One step of the primary reward request calculation. */
export interface PrimaryRewardRequestStep {
  describe(): string;
  adjust(item: PrimaryRewardRequest, value: number): number;
}

export class NamePrimaryRewardRequestAdjuster implements PrimaryRewardRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryRewardRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryRewardRequestAdjuster implements PrimaryRewardRequestStep {
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

  adjust(item: PrimaryRewardRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryRewardRequestAdjuster implements PrimaryRewardRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryRewardRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryRewardRequestAdjuster implements PrimaryRewardRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryRewardRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryRewardRequestAdjuster implements PrimaryRewardRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryRewardRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary reward request steps in order and keeps a trace of each. */
export class PrimaryRewardRequestEngine {
  steps: PrimaryRewardRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryRewardRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryRewardRequest): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PrimaryRewardRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryRewardRequestEngine(flagsValue: flags.Registry): PrimaryRewardRequestEngine {
  return new PrimaryRewardRequestEngine(
    [
      new NamePrimaryRewardRequestAdjuster(
        new Map<string, number>([["central", 0.85], ["south", 1], ["online", 0.91]]),
      ),
      new FlaggedPrimaryRewardRequestAdjuster(flagsValue, "primary-reward-request-adaptive", 9.3),
      new CapPrimaryRewardRequestAdjuster(42449),
      new MinimumPrimaryRewardRequestAdjuster(33.9),
      new PercentPrimaryRewardRequestAdjuster(21.5),
    ],
    [],
    2.8,
    9490.1,
  );
}
