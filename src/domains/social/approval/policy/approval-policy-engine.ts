import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalPolicy } from "./approval-policy.js";

/** One step of the approval policy calculation. */
export interface ApprovalPolicyAdjuster {
  describe(): string;
  adjust(item: ApprovalPolicy, value: number): number;
}

export class FlaggedApprovalPolicyAdjuster implements ApprovalPolicyAdjuster {
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

  adjust(item: ApprovalPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryApprovalPolicyAdjuster implements ApprovalPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ApprovalPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredApprovalPolicyAdjuster implements ApprovalPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapApprovalPolicyAdjuster implements ApprovalPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the approval policy steps in order and keeps a trace of each. */
export class ApprovalPolicyEngine {
  steps: ApprovalPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalPolicy): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ApprovalPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalPolicyEngine(flagsValue: flags.Registry): ApprovalPolicyEngine {
  return new ApprovalPolicyEngine(
    [
      new FlaggedApprovalPolicyAdjuster(flagsValue, "approval-policy-scheduled", -7.4),
      new CountryApprovalPolicyAdjuster(
        new Map<string, number>([["north", 1.27], ["west", 1.28], ["east", 1.33]]),
      ),
      new TieredApprovalPolicyAdjuster([1455, 2983, 9051], [0.9, 0.98, 1.16]),
      new CapApprovalPolicyAdjuster(24506),
    ],
    [],
    2.3,
    28426.2,
  );
}
