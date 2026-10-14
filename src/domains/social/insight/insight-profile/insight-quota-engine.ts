import * as flags from "../../../../kit/flags.js";
import { InsightQuota } from "./insight-quota.js";

/** One step of the insight quota calculation. */
export interface InsightQuotaFactor {
  describe(): string;
  adjust(item: InsightQuota, value: number): number;
}

export class MinimumInsightQuotaAdjuster implements InsightQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInsightQuotaAdjuster implements InsightQuotaFactor {
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

  adjust(item: InsightQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInsightQuotaAdjuster implements InsightQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the insight quota steps in order and keeps a trace of each. */
export class InsightQuotaEngine {
  steps: InsightQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightQuota): number {
    let current = item.netLoad();
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

  evaluateAll(items: InsightQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightQuotaEngine(flagsValue: flags.Registry): InsightQuotaEngine {
  return new InsightQuotaEngine(
    [
      new MinimumInsightQuotaAdjuster(13.1),
      new FlaggedInsightQuotaAdjuster(flagsValue, "insight-quota-seasonal", 0.5),
      new CapInsightQuotaAdjuster(12569),
    ],
    [],
    5,
    66647.9,
  );
}
