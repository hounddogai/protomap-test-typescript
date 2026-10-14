import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionAudit } from "./deflection-audit.js";

/** One step of the deflection audit calculation. */
export interface DeflectionAuditModifier {
  describe(): string;
  adjust(item: DeflectionAudit, value: number): number;
}

export class CapDeflectionAuditAdjuster implements DeflectionAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDeflectionAuditAdjuster implements DeflectionAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DeflectionAuditClicksOffsetAdjuster implements DeflectionAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: DeflectionAudit, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class FlaggedDeflectionAuditAdjuster implements DeflectionAuditModifier {
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

  adjust(item: DeflectionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the deflection audit steps in order and keeps a trace of each. */
export class DeflectionAuditEngine {
  steps: DeflectionAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionAudit): number {
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

  evaluateAll(items: DeflectionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionAuditEngine(flagsValue: flags.Registry): DeflectionAuditEngine {
  return new DeflectionAuditEngine(
    [
      new CapDeflectionAuditAdjuster(24671),
      new MinimumDeflectionAuditAdjuster(28.6),
      new DeflectionAuditClicksOffsetAdjuster(1.53),
      new FlaggedDeflectionAuditAdjuster(flagsValue, "deflection-audit-legacy", 1.3),
    ],
    [],
    2.6,
    81143.8,
  );
}
