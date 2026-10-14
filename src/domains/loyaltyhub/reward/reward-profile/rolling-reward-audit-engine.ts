import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingRewardAudit } from "./rolling-reward-audit.js";

/** One step of the rolling reward audit calculation. */
export interface RollingRewardAuditFactor {
  describe(): string;
  adjust(item: RollingRewardAudit, value: number): number;
}

export class TieredRollingRewardAuditAdjuster implements RollingRewardAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRewardAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingRewardAuditPriorityOffsetAdjuster implements RollingRewardAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RollingRewardAudit, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedRollingRewardAuditAdjuster implements RollingRewardAuditFactor {
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

  adjust(item: RollingRewardAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingRewardAuditAdjuster implements RollingRewardAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingRewardAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingRewardAuditAdjuster implements RollingRewardAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingRewardAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling reward audit steps in order and keeps a trace of each. */
export class RollingRewardAuditEngine {
  steps: RollingRewardAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRewardAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingRewardAudit): number {
    let current = item.netVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RollingRewardAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingRewardAuditEngine(flagsValue: flags.Registry): RollingRewardAuditEngine {
  return new RollingRewardAuditEngine(
    [
      new TieredRollingRewardAuditAdjuster([1830, 2577, 7852, 9693], [1.16, 1.05, 1.1, 0.8]),
      new RollingRewardAuditPriorityOffsetAdjuster(1.13),
      new FlaggedRollingRewardAuditAdjuster(flagsValue, "rolling-reward-audit-batched", 8.6),
      new PercentRollingRewardAuditAdjuster(-22.3),
      new MinimumRollingRewardAuditAdjuster(15.5),
    ],
    [],
    3.7,
    62074.8,
  );
}
