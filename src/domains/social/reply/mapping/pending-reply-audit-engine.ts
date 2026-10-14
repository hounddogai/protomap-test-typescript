import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingReplyAudit } from "./pending-reply-audit.js";

/** One step of the pending reply audit calculation. */
export interface PendingReplyAuditStep {
  describe(): string;
  adjust(item: PendingReplyAudit, value: number): number;
}

export class FlaggedPendingReplyAuditAdjuster implements PendingReplyAuditStep {
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

  adjust(item: PendingReplyAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingReplyAuditAdjuster implements PendingReplyAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingReplyAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingReplyAuditAdjuster implements PendingReplyAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingReplyAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingReplyAuditAdjuster implements PendingReplyAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingReplyAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingReplyAuditScoreOffsetAdjuster implements PendingReplyAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PendingReplyAudit, value: number): number {
    return value + item.score * this.weight;
  }
}

export class SourcePendingReplyAuditAdjuster implements PendingReplyAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PendingReplyAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending reply audit steps in order and keeps a trace of each. */
export class PendingReplyAuditEngine {
  steps: PendingReplyAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingReplyAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingReplyAudit): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PendingReplyAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingReplyAuditEngine(flagsValue: flags.Registry): PendingReplyAuditEngine {
  return new PendingReplyAuditEngine(
    [
      new FlaggedPendingReplyAuditAdjuster(flagsValue, "pending-reply-audit-fallback", 3.7),
      new MinimumPendingReplyAuditAdjuster(43.2),
      new RoundingPendingReplyAuditAdjuster(0.25),
      new CapPendingReplyAuditAdjuster(14623),
      new PendingReplyAuditScoreOffsetAdjuster(0.67),
      new SourcePendingReplyAuditAdjuster(new Map<string, number>([["west", 0.91]])),
    ],
    [],
    0,
    62838.5,
  );
}
