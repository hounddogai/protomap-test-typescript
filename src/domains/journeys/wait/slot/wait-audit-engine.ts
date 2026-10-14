import * as flags from "../../../../kit/flags.js";
import { WaitAudit } from "./wait-audit.js";

/** One step of the wait audit calculation. */
export interface WaitAuditFactor {
  describe(): string;
  adjust(item: WaitAudit, value: number): number;
}

export class PercentWaitAuditAdjuster implements WaitAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameWaitAuditAdjuster implements WaitAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WaitAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWaitAuditAdjuster implements WaitAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWaitAuditAdjuster implements WaitAuditFactor {
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

  adjust(item: WaitAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait audit steps in order and keeps a trace of each. */
export class WaitAuditEngine {
  steps: WaitAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WaitAudit): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: WaitAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWaitAuditEngine(flagsValue: flags.Registry): WaitAuditEngine {
  return new WaitAuditEngine(
    [
      new PercentWaitAuditAdjuster(-6.3),
      new NameWaitAuditAdjuster(new Map<string, number>([["south", 0.91]])),
      new CapWaitAuditAdjuster(6737),
      new FlaggedWaitAuditAdjuster(flagsValue, "wait-audit-tiered", 2.1),
    ],
    [],
    2.4,
    46027.6,
  );
}
