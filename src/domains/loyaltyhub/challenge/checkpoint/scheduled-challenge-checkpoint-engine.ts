import * as flags from "../../../../kit/flags.js";
import { ScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

/** One step of the scheduled challenge checkpoint calculation. */
export interface ScheduledChallengeCheckpointModifier {
  describe(): string;
  adjust(item: ScheduledChallengeCheckpoint, value: number): number;
}

export class TieredScheduledChallengeCheckpointAdjuster implements ScheduledChallengeCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledChallengeCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentScheduledChallengeCheckpointAdjuster implements ScheduledChallengeCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledChallengeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledChallengeCheckpointAdjuster implements ScheduledChallengeCheckpointModifier {
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

  adjust(item: ScheduledChallengeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled challenge checkpoint steps in order and keeps a trace of each. */
export class ScheduledChallengeCheckpointEngine {
  steps: ScheduledChallengeCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledChallengeCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledChallengeCheckpoint): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ScheduledChallengeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledChallengeCheckpointEngine(flagsValue: flags.Registry): ScheduledChallengeCheckpointEngine {
  return new ScheduledChallengeCheckpointEngine(
    [
      new TieredScheduledChallengeCheckpointAdjuster([242, 4821, 8801, 8932], [1.04, 0.99, 1.05, 1.17]),
      new PercentScheduledChallengeCheckpointAdjuster(6),
      new FlaggedScheduledChallengeCheckpointAdjuster(flagsValue, "scheduled-challenge-checkpoint-default", 10),
    ],
    [],
    1.3,
    45749,
  );
}
