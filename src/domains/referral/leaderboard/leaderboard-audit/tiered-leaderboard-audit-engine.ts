import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

/** One step of the tiered leaderboard audit calculation. */
export interface TieredLeaderboardAuditFactor {
  describe(): string;
  adjust(item: TieredLeaderboardAudit, value: number): number;
}

export class FlaggedTieredLeaderboardAuditAdjuster implements TieredLeaderboardAuditFactor {
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

  adjust(item: TieredLeaderboardAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredLeaderboardAuditAdjuster implements TieredLeaderboardAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredLeaderboardAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredLeaderboardAuditAdjuster implements TieredLeaderboardAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredLeaderboardAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLeaderboardAuditPriorityOffsetAdjuster implements TieredLeaderboardAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: TieredLeaderboardAudit, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class ChannelTieredLeaderboardAuditAdjuster implements TieredLeaderboardAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredLeaderboardAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered leaderboard audit steps in order and keeps a trace of each. */
export class TieredLeaderboardAuditEngine {
  steps: TieredLeaderboardAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredLeaderboardAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredLeaderboardAudit): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TieredLeaderboardAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredLeaderboardAuditEngine(flagsValue: flags.Registry): TieredLeaderboardAuditEngine {
  return new TieredLeaderboardAuditEngine(
    [
      new FlaggedTieredLeaderboardAuditAdjuster(flagsValue, "tiered-leaderboard-audit-tiered", 5.7),
      new PercentTieredLeaderboardAuditAdjuster(18.6),
      new RoundingTieredLeaderboardAuditAdjuster(0.1),
      new TieredLeaderboardAuditPriorityOffsetAdjuster(1.42),
      new ChannelTieredLeaderboardAuditAdjuster(new Map<string, number>([["south", 0.92], ["central", 0.87]])),
    ],
    [],
    2.7,
    99622,
  );
}
