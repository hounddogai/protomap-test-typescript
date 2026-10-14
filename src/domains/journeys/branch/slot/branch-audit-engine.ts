import * as flags from "../../../../kit/flags.js";
import { BranchAudit } from "./branch-audit.js";

/** One step of the branch audit calculation. */
export interface BranchAuditAdjuster {
  describe(): string;
  adjust(item: BranchAudit, value: number): number;
}

export class MinimumBranchAuditAdjuster implements BranchAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBranchAuditAdjuster implements BranchAuditAdjuster {
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

  adjust(item: BranchAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBranchAuditAdjuster implements BranchAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch audit steps in order and keeps a trace of each. */
export class BranchAuditEngine {
  steps: BranchAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BranchAudit): number {
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

  evaluateAll(items: BranchAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBranchAuditEngine(flagsValue: flags.Registry): BranchAuditEngine {
  return new BranchAuditEngine(
    [
      new MinimumBranchAuditAdjuster(7.1),
      new FlaggedBranchAuditAdjuster(flagsValue, "branch-audit-manual", 0.6),
      new PercentBranchAuditAdjuster(13.2),
    ],
    [],
    1.5,
    97718,
  );
}
