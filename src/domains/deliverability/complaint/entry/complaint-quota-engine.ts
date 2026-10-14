import * as flags from "../../../../kit/flags.js";
import { ComplaintQuota } from "./complaint-quota.js";

/** One step of the complaint quota calculation. */
export interface ComplaintQuotaModifier {
  describe(): string;
  adjust(item: ComplaintQuota, value: number): number;
}

export class ComplaintQuotaCeilingOffsetAdjuster implements ComplaintQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ComplaintQuota, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedComplaintQuotaAdjuster implements ComplaintQuotaModifier {
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

  adjust(item: ComplaintQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentComplaintQuotaAdjuster implements ComplaintQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint quota steps in order and keeps a trace of each. */
export class ComplaintQuotaEngine {
  steps: ComplaintQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintQuota): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ComplaintQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintQuotaEngine(flagsValue: flags.Registry): ComplaintQuotaEngine {
  return new ComplaintQuotaEngine(
    [
      new ComplaintQuotaCeilingOffsetAdjuster(0.49),
      new FlaggedComplaintQuotaAdjuster(flagsValue, "complaint-quota-legacy", 2.5),
      new PercentComplaintQuotaAdjuster(10.2),
    ],
    [],
    5,
    36616.1,
  );
}
