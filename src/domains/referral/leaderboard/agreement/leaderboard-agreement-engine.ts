import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardAgreement } from "./leaderboard-agreement.js";

/** One step of the leaderboard agreement calculation. */
export interface LeaderboardAgreementAdjuster {
  describe(): string;
  adjust(item: LeaderboardAgreement, value: number): number;
}

export class MinimumLeaderboardAgreementAdjuster implements LeaderboardAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLeaderboardAgreementAdjuster implements LeaderboardAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LeaderboardAgreementRatioOffsetAdjuster implements LeaderboardAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: LeaderboardAgreement, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the leaderboard agreement steps in order and keeps a trace of each. */
export class LeaderboardAgreementEngine {
  steps: LeaderboardAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardAgreement): number {
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

  evaluateAll(items: LeaderboardAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardAgreementEngine(): LeaderboardAgreementEngine {
  return new LeaderboardAgreementEngine(
    [
      new MinimumLeaderboardAgreementAdjuster(20.4),
      new RoundingLeaderboardAgreementAdjuster(0.25),
      new LeaderboardAgreementRatioOffsetAdjuster(1.46),
    ],
    [],
    5,
    76814.3,
  );
}
