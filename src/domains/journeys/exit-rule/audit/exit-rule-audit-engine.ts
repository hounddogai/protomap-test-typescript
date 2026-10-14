import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleAudit } from "./exit-rule-audit.js";

/** One step of the exit rule audit calculation. */
export interface ExitRuleAuditFactor {
  describe(): string;
  adjust(item: ExitRuleAudit, value: number): number;
}

export class ExitRuleAuditScoreOffsetAdjuster implements ExitRuleAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ExitRuleAudit, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedExitRuleAuditAdjuster implements ExitRuleAuditFactor {
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

  adjust(item: ExitRuleAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleAuditAdjuster implements ExitRuleAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredExitRuleAuditAdjuster implements ExitRuleAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumExitRuleAuditAdjuster implements ExitRuleAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapExitRuleAuditAdjuster implements ExitRuleAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the exit rule audit steps in order and keeps a trace of each. */
export class ExitRuleAuditEngine {
  steps: ExitRuleAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleAudit): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ExitRuleAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleAuditEngine(flagsValue: flags.Registry): ExitRuleAuditEngine {
  return new ExitRuleAuditEngine(
    [
      new ExitRuleAuditScoreOffsetAdjuster(0.77),
      new FlaggedExitRuleAuditAdjuster(flagsValue, "exit-rule-audit-default", 0.5),
      new RoundingExitRuleAuditAdjuster(0.1),
      new TieredExitRuleAuditAdjuster([1515, 1716, 2012, 7537], [1.17, 1.13, 0.94, 0.96]),
      new MinimumExitRuleAuditAdjuster(32.8),
      new CapExitRuleAuditAdjuster(6248),
    ],
    [],
    3,
    51125.3,
  );
}
