import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

/** One step of the seasonal leaderboard agreement calculation. */
export interface SeasonalLeaderboardAgreementModifier {
  describe(): string;
  adjust(item: SeasonalLeaderboardAgreement, value: number): number;
}

export class RoundingSeasonalLeaderboardAgreementAdjuster implements SeasonalLeaderboardAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalLeaderboardAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalLeaderboardAgreementAdjuster implements SeasonalLeaderboardAgreementModifier {
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

  adjust(item: SeasonalLeaderboardAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalLeaderboardAgreementAdjuster implements SeasonalLeaderboardAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalLeaderboardAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSeasonalLeaderboardAgreementAdjuster implements SeasonalLeaderboardAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalLeaderboardAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalLeaderboardAgreementAdjuster implements SeasonalLeaderboardAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalLeaderboardAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal leaderboard agreement steps in order and keeps a trace of each. */
export class SeasonalLeaderboardAgreementEngine {
  steps: SeasonalLeaderboardAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLeaderboardAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalLeaderboardAgreement): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SeasonalLeaderboardAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalLeaderboardAgreementEngine(flagsValue: flags.Registry): SeasonalLeaderboardAgreementEngine {
  return new SeasonalLeaderboardAgreementEngine(
    [
      new RoundingSeasonalLeaderboardAgreementAdjuster(0.5),
      new FlaggedSeasonalLeaderboardAgreementAdjuster(flagsValue, "seasonal-leaderboard-agreement-pending", 8.6),
      new MinimumSeasonalLeaderboardAgreementAdjuster(31.6),
      new CapSeasonalLeaderboardAgreementAdjuster(48375),
      new PercentSeasonalLeaderboardAgreementAdjuster(8.4),
    ],
    [],
    2.4,
    21102.2,
  );
}
