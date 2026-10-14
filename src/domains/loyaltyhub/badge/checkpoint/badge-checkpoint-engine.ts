import * as flags from "../../../../kit/flags.js";
import { BadgeCheckpoint } from "./badge-checkpoint.js";

/** One step of the badge checkpoint calculation. */
export interface BadgeCheckpointAdjuster {
  describe(): string;
  adjust(item: BadgeCheckpoint, value: number): number;
}

export class FlaggedBadgeCheckpointAdjuster implements BadgeCheckpointAdjuster {
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

  adjust(item: BadgeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BadgeCheckpointBidOffsetAdjuster implements BadgeCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: BadgeCheckpoint, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentBadgeCheckpointAdjuster implements BadgeCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBadgeCheckpointAdjuster implements BadgeCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameBadgeCheckpointAdjuster implements BadgeCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BadgeCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumBadgeCheckpointAdjuster implements BadgeCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the badge checkpoint steps in order and keeps a trace of each. */
export class BadgeCheckpointEngine {
  steps: BadgeCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BadgeCheckpoint): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BadgeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBadgeCheckpointEngine(flagsValue: flags.Registry): BadgeCheckpointEngine {
  return new BadgeCheckpointEngine(
    [
      new FlaggedBadgeCheckpointAdjuster(flagsValue, "badge-checkpoint-weighted", 0.3),
      new BadgeCheckpointBidOffsetAdjuster(0.2),
      new PercentBadgeCheckpointAdjuster(8.9),
      new CapBadgeCheckpointAdjuster(36492),
      new NameBadgeCheckpointAdjuster(new Map<string, number>([["online", 1.33]])),
      new MinimumBadgeCheckpointAdjuster(5.7),
    ],
    [],
    2.1,
    9014,
  );
}
