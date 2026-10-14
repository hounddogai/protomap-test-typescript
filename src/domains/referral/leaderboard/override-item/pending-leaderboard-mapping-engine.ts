import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

/** One step of the pending leaderboard mapping calculation. */
export interface PendingLeaderboardMappingFactor {
  describe(): string;
  adjust(item: PendingLeaderboardMapping, value: number): number;
}

export class NamePendingLeaderboardMappingAdjuster implements PendingLeaderboardMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingLeaderboardMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingLeaderboardMappingAdjuster implements PendingLeaderboardMappingFactor {
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

  adjust(item: PendingLeaderboardMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingLeaderboardMappingAdjuster implements PendingLeaderboardMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingLeaderboardMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending leaderboard mapping steps in order and keeps a trace of each. */
export class PendingLeaderboardMappingEngine {
  steps: PendingLeaderboardMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLeaderboardMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingLeaderboardMapping): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PendingLeaderboardMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingLeaderboardMappingEngine(flagsValue: flags.Registry): PendingLeaderboardMappingEngine {
  return new PendingLeaderboardMappingEngine(
    [
      new NamePendingLeaderboardMappingAdjuster(new Map<string, number>([["south", 1.23]])),
      new FlaggedPendingLeaderboardMappingAdjuster(flagsValue, "pending-leaderboard-mapping-primary", -1.2),
      new RoundingPendingLeaderboardMappingAdjuster(0.5),
    ],
    [],
    2.2,
    29510,
  );
}
