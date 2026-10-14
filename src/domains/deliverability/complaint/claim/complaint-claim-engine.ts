import * as flags from "../../../../kit/flags.js";
import { ComplaintClaim } from "./complaint-claim.js";

/** One step of the complaint claim calculation. */
export interface ComplaintClaimFactor {
  describe(): string;
  adjust(item: ComplaintClaim, value: number): number;
}

export class FlaggedComplaintClaimAdjuster implements ComplaintClaimFactor {
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

  adjust(item: ComplaintClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapComplaintClaimAdjuster implements ComplaintClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ComplaintClaimAmountOffsetAdjuster implements ComplaintClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ComplaintClaim, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class CategoryComplaintClaimAdjuster implements ComplaintClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ComplaintClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the complaint claim steps in order and keeps a trace of each. */
export class ComplaintClaimEngine {
  steps: ComplaintClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintClaim): number {
    let current = item.netTotal();
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

  evaluateAll(items: ComplaintClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintClaimEngine(flagsValue: flags.Registry): ComplaintClaimEngine {
  return new ComplaintClaimEngine(
    [
      new FlaggedComplaintClaimAdjuster(flagsValue, "complaint-claim-seasonal", 7),
      new CapComplaintClaimAdjuster(13598),
      new ComplaintClaimAmountOffsetAdjuster(1.17),
      new CategoryComplaintClaimAdjuster(new Map<string, number>([["online", 1.39], ["south", 0.89]])),
    ],
    [],
    4.7,
    80899.3,
  );
}
