import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalRequest } from "./approval-request.js";

/** One step of the approval request calculation. */
export interface ApprovalRequestModifier {
  describe(): string;
  adjust(item: ApprovalRequest, value: number): number;
}

export class CapApprovalRequestAdjuster implements ApprovalRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedApprovalRequestAdjuster implements ApprovalRequestModifier {
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

  adjust(item: ApprovalRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ApprovalRequestMaximumOffsetAdjuster implements ApprovalRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: ApprovalRequest, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the approval request steps in order and keeps a trace of each. */
export class ApprovalRequestEngine {
  steps: ApprovalRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ApprovalRequest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ApprovalRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultApprovalRequestEngine(flagsValue: flags.Registry): ApprovalRequestEngine {
  return new ApprovalRequestEngine(
    [
      new CapApprovalRequestAdjuster(23307),
      new FlaggedApprovalRequestAdjuster(flagsValue, "approval-request-capped", 5.3),
      new ApprovalRequestMaximumOffsetAdjuster(1.34),
    ],
    [],
    4.8,
    45884,
  );
}
