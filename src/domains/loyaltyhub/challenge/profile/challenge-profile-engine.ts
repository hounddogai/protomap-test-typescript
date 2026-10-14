import * as flags from "../../../../kit/flags.js";
import { ChallengeProfile } from "./challenge-profile.js";

/** One step of the challenge profile calculation. */
export interface ChallengeProfileAdjuster {
  describe(): string;
  adjust(item: ChallengeProfile, value: number): number;
}

export class FlaggedChallengeProfileAdjuster implements ChallengeProfileAdjuster {
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

  adjust(item: ChallengeProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelChallengeProfileAdjuster implements ChallengeProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ChallengeProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ChallengeProfileBatchSizeOffsetAdjuster implements ChallengeProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: ChallengeProfile, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the challenge profile steps in order and keeps a trace of each. */
export class ChallengeProfileEngine {
  steps: ChallengeProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ChallengeProfile): number {
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

  evaluateAll(items: ChallengeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultChallengeProfileEngine(flagsValue: flags.Registry): ChallengeProfileEngine {
  return new ChallengeProfileEngine(
    [
      new FlaggedChallengeProfileAdjuster(flagsValue, "challenge-profile-strict", -6.2),
      new ChannelChallengeProfileAdjuster(new Map<string, number>([["east", 0.75], ["central", 1.36]])),
      new ChallengeProfileBatchSizeOffsetAdjuster(1.02),
    ],
    [],
    1.1,
    28481.9,
  );
}
