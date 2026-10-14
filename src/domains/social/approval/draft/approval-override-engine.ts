import * as flags from "../../../../kit/flags.js";
import { ApprovalOverride } from "./approval-override.js";

/** One step of the approval override calculation. */
export interface ApprovalOverrideAdjuster {
  describe(): string;
  adjust(item: ApprovalOverride, value: number): number;
}

export class PercentApprovalOverrideAdjuster implements ApprovalOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedApprovalOverrideAdjuster implements ApprovalOverrideAdjuster {
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

  adjust(item: ApprovalOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleApprovalOverrideAdjuster implements ApprovalOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ApprovalOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumApprovalOverrideAdjuster implements ApprovalOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredApprovalOverrideAdjuster implements ApprovalOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the approval override steps in order and keeps a trace of each. */
export class ApprovalOverrideEngine {
  steps: ApprovalOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalOverride): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ApprovalOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalOverrideEngine(flagsValue: flags.Registry): ApprovalOverrideEngine {
  return new ApprovalOverrideEngine(
    [
      new PercentApprovalOverrideAdjuster(11.1),
      new FlaggedApprovalOverrideAdjuster(flagsValue, "approval-override-fallback", -7.2),
      new TitleApprovalOverrideAdjuster(
        new Map<string, number>([["east", 1.05], ["retail", 0.83], ["online", 1.18]]),
      ),
      new MinimumApprovalOverrideAdjuster(3.7),
      new TieredApprovalOverrideAdjuster([809, 1650, 4191, 5129], [0.89, 1.16, 0.89, 0.93]),
    ],
    [],
    0.7,
    99895,
  );
}
