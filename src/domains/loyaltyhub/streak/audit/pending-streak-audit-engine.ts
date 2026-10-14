import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingStreakAudit } from "./pending-streak-audit.js";

/** One step of the pending streak audit calculation. */
export interface PendingStreakAuditModifier {
  describe(): string;
  adjust(item: PendingStreakAudit, value: number): number;
}

export class FlaggedPendingStreakAuditAdjuster implements PendingStreakAuditModifier {
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

  adjust(item: PendingStreakAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingStreakAuditAdjuster implements PendingStreakAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingStreakAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingStreakAuditLimitOffsetAdjuster implements PendingStreakAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PendingStreakAudit, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TitlePendingStreakAuditAdjuster implements PendingStreakAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingStreakAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingStreakAuditAdjuster implements PendingStreakAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingStreakAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingStreakAuditAdjuster implements PendingStreakAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingStreakAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending streak audit steps in order and keeps a trace of each. */
export class PendingStreakAuditEngine {
  steps: PendingStreakAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStreakAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingStreakAudit): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingStreakAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingStreakAuditEngine(flagsValue: flags.Registry): PendingStreakAuditEngine {
  return new PendingStreakAuditEngine(
    [
      new FlaggedPendingStreakAuditAdjuster(flagsValue, "pending-streak-audit-global", -1.3),
      new RoundingPendingStreakAuditAdjuster(0.05),
      new PendingStreakAuditLimitOffsetAdjuster(0.95),
      new TitlePendingStreakAuditAdjuster(
        new Map<string, number>([["central", 1.09], ["retail", 1.23], ["west", 0.84]]),
      ),
      new PercentPendingStreakAuditAdjuster(-17.3),
      new CapPendingStreakAuditAdjuster(46586),
    ],
    [],
    2.4,
    74242.3,
  );
}
