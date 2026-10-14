import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingAudit } from "./pacing-audit.js";

/** One step of the pacing audit calculation. */
export interface PacingAuditModifier {
  describe(): string;
  adjust(item: PacingAudit, value: number): number;
}

export class MinimumPacingAuditAdjuster implements PacingAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PacingAuditLimitOffsetAdjuster implements PacingAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PacingAudit, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class FlaggedPacingAuditAdjuster implements PacingAuditModifier {
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

  adjust(item: PacingAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePacingAuditAdjuster implements PacingAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PacingAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPacingAuditAdjuster implements PacingAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing audit steps in order and keeps a trace of each. */
export class PacingAuditEngine {
  steps: PacingAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingAudit): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PacingAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingAuditEngine(flagsValue: flags.Registry): PacingAuditEngine {
  return new PacingAuditEngine(
    [
      new MinimumPacingAuditAdjuster(17.3),
      new PacingAuditLimitOffsetAdjuster(0.71),
      new FlaggedPacingAuditAdjuster(flagsValue, "pacing-audit-legacy", -9.8),
      new TitlePacingAuditAdjuster(new Map<string, number>([["east", 0.98], ["west", 0.81]])),
      new CapPacingAuditAdjuster(40367),
    ],
    [],
    1.3,
    49229.2,
  );
}
