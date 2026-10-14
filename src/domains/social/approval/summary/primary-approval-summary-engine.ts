import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryApprovalSummary } from "./primary-approval-summary.js";

/** One step of the primary approval summary calculation. */
export interface PrimaryApprovalSummaryModifier {
  describe(): string;
  adjust(item: PrimaryApprovalSummary, value: number): number;
}

export class CapPrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryApprovalSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryApprovalSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
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

  adjust(item: PrimaryApprovalSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryApprovalSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryApprovalSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryApprovalSummaryAdjuster implements PrimaryApprovalSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryApprovalSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary approval summary steps in order and keeps a trace of each. */
export class PrimaryApprovalSummaryEngine {
  steps: PrimaryApprovalSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryApprovalSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryApprovalSummary): number {
    let current = item.netValue();
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

  evaluateAll(items: PrimaryApprovalSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryApprovalSummaryEngine(flagsValue: flags.Registry): PrimaryApprovalSummaryEngine {
  return new PrimaryApprovalSummaryEngine(
    [
      new CapPrimaryApprovalSummaryAdjuster(26462),
      new LocalePrimaryApprovalSummaryAdjuster(new Map<string, number>([["east", 1.21], ["south", 1.37]])),
      new FlaggedPrimaryApprovalSummaryAdjuster(flagsValue, "primary-approval-summary-lenient", 5.4),
      new RoundingPrimaryApprovalSummaryAdjuster(0.25),
      new MinimumPrimaryApprovalSummaryAdjuster(2.5),
      new PercentPrimaryApprovalSummaryAdjuster(-3.1),
    ],
    [],
    4.6,
    75357,
  );
}
