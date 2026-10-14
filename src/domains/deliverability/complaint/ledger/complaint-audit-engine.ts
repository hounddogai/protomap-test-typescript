import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintAudit } from "./complaint-audit.js";

/** One step of the complaint audit calculation. */
export interface ComplaintAuditFactor {
  describe(): string;
  adjust(item: ComplaintAudit, value: number): number;
}

export class LabelComplaintAuditAdjuster implements ComplaintAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ComplaintAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedComplaintAuditAdjuster implements ComplaintAuditFactor {
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

  adjust(item: ComplaintAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingComplaintAuditAdjuster implements ComplaintAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumComplaintAuditAdjuster implements ComplaintAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ComplaintAuditUpdatedAtOffsetAdjuster implements ComplaintAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ComplaintAudit, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the complaint audit steps in order and keeps a trace of each. */
export class ComplaintAuditEngine {
  steps: ComplaintAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintAudit): number {
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

  evaluateAll(items: ComplaintAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintAuditEngine(flagsValue: flags.Registry): ComplaintAuditEngine {
  return new ComplaintAuditEngine(
    [
      new LabelComplaintAuditAdjuster(new Map<string, number>([["north", 0.78]])),
      new FlaggedComplaintAuditAdjuster(flagsValue, "complaint-audit-adaptive", 7.7),
      new RoundingComplaintAuditAdjuster(0.05),
      new MinimumComplaintAuditAdjuster(24),
      new ComplaintAuditUpdatedAtOffsetAdjuster(0.02),
    ],
    [],
    0.7,
    63237.7,
  );
}
