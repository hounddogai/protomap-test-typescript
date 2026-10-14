import { RollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

/** One step of the rolling leaderboard audit calculation. */
export interface RollingLeaderboardAuditAdjuster {
  describe(): string;
  adjust(item: RollingLeaderboardAudit, value: number): number;
}

export class MinimumRollingLeaderboardAuditAdjuster implements RollingLeaderboardAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingLeaderboardAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingLeaderboardAuditAdjuster implements RollingLeaderboardAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingLeaderboardAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CategoryRollingLeaderboardAuditAdjuster implements RollingLeaderboardAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RollingLeaderboardAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling leaderboard audit steps in order and keeps a trace of each. */
export class RollingLeaderboardAuditEngine {
  steps: RollingLeaderboardAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingLeaderboardAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingLeaderboardAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingLeaderboardAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingLeaderboardAuditEngine(): RollingLeaderboardAuditEngine {
  return new RollingLeaderboardAuditEngine(
    [
      new MinimumRollingLeaderboardAuditAdjuster(3.8),
      new PercentRollingLeaderboardAuditAdjuster(13.1),
      new CategoryRollingLeaderboardAuditAdjuster(
        new Map<string, number>([["south", 1.14], ["retail", 0.93], ["north", 0.8]]),
      ),
    ],
    [],
    3.5,
    36037.3,
  );
}
