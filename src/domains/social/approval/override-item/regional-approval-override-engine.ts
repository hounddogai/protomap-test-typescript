import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalApprovalOverride } from "./regional-approval-override.js";

/** One step of the regional approval override calculation. */
export interface RegionalApprovalOverrideModifier {
  describe(): string;
  adjust(item: RegionalApprovalOverride, value: number): number;
}

export class PercentRegionalApprovalOverrideAdjuster implements RegionalApprovalOverrideModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalApprovalOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalApprovalOverrideAdjuster implements RegionalApprovalOverrideModifier {
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

  adjust(item: RegionalApprovalOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalApprovalOverrideAdjuster implements RegionalApprovalOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalApprovalOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameRegionalApprovalOverrideAdjuster implements RegionalApprovalOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RegionalApprovalOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional approval override steps in order and keeps a trace of each. */
export class RegionalApprovalOverrideEngine {
  steps: RegionalApprovalOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalApprovalOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalApprovalOverride): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RegionalApprovalOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalApprovalOverrideEngine(flagsValue: flags.Registry): RegionalApprovalOverrideEngine {
  return new RegionalApprovalOverrideEngine(
    [
      new PercentRegionalApprovalOverrideAdjuster(7.1),
      new FlaggedRegionalApprovalOverrideAdjuster(flagsValue, "regional-approval-override-global", -9.7),
      new CapRegionalApprovalOverrideAdjuster(28507),
      new NameRegionalApprovalOverrideAdjuster(
        new Map<string, number>([["north", 1.23], ["retail", 0.84], ["east", 1]]),
      ),
    ],
    [],
    4.6,
    12601.9,
  );
}
