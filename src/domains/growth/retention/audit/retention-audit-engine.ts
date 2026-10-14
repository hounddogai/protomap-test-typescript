import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionAudit } from "./retention-audit.js";

/** One step of the retention audit calculation. */
export interface RetentionAuditAdjuster {
  describe(): string;
  adjust(item: RetentionAudit, value: number): number;
}

export class TitleRetentionAuditAdjuster implements RetentionAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RetentionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRetentionAuditAdjuster implements RetentionAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRetentionAuditAdjuster implements RetentionAuditAdjuster {
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

  adjust(item: RetentionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRetentionAuditAdjuster implements RetentionAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRetentionAuditAdjuster implements RetentionAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRetentionAuditAdjuster implements RetentionAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention audit steps in order and keeps a trace of each. */
export class RetentionAuditEngine {
  steps: RetentionAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionAudit): number {
    let current = item.netVolume();
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

  evaluateAll(items: RetentionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionAuditEngine(flagsValue: flags.Registry): RetentionAuditEngine {
  return new RetentionAuditEngine(
    [
      new TitleRetentionAuditAdjuster(new Map<string, number>([["east", 1.25]])),
      new TieredRetentionAuditAdjuster([6876, 7164], [1.01, 1.03]),
      new FlaggedRetentionAuditAdjuster(flagsValue, "retention-audit-seasonal", 7.1),
      new RoundingRetentionAuditAdjuster(0.05),
      new MinimumRetentionAuditAdjuster(45.5),
      new PercentRetentionAuditAdjuster(-16),
    ],
    [],
    4.8,
    20505.3,
  );
}
