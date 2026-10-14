import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationQuota } from "./reputation-quota.js";

/** One step of the reputation quota calculation. */
export interface ReputationQuotaFactor {
  describe(): string;
  adjust(item: ReputationQuota, value: number): number;
}

export class MinimumReputationQuotaAdjuster implements ReputationQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ReputationQuotaCeilingOffsetAdjuster implements ReputationQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ReputationQuota, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class PercentReputationQuotaAdjuster implements ReputationQuotaFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedReputationQuotaAdjuster implements ReputationQuotaFactor {
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

  adjust(item: ReputationQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentReputationQuotaAdjuster implements ReputationQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ReputationQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation quota steps in order and keeps a trace of each. */
export class ReputationQuotaEngine {
  steps: ReputationQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationQuota): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ReputationQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationQuotaEngine(flagsValue: flags.Registry): ReputationQuotaEngine {
  return new ReputationQuotaEngine(
    [
      new MinimumReputationQuotaAdjuster(0.1),
      new ReputationQuotaCeilingOffsetAdjuster(0.9),
      new PercentReputationQuotaAdjuster(-9.1),
      new FlaggedReputationQuotaAdjuster(flagsValue, "reputation-quota-default", 7.3),
      new SegmentReputationQuotaAdjuster(
        new Map<string, number>([["north", 0.79], ["east", 1.25], ["retail", 1.35]]),
      ),
    ],
    [],
    0.3,
    97464.3,
  );
}
