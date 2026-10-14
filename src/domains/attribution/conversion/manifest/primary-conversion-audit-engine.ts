import * as numbers from "../../../../kit/numbers.js";
import { PrimaryConversionAudit } from "./primary-conversion-audit.js";

/** One step of the primary conversion audit calculation. */
export interface PrimaryConversionAuditModifier {
  describe(): string;
  adjust(item: PrimaryConversionAudit, value: number): number;
}

export class PercentPrimaryConversionAuditAdjuster implements PrimaryConversionAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryConversionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryConversionAuditAdjuster implements PrimaryConversionAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryConversionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocalePrimaryConversionAuditAdjuster implements PrimaryConversionAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryConversionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary conversion audit steps in order and keeps a trace of each. */
export class PrimaryConversionAuditEngine {
  steps: PrimaryConversionAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryConversionAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryConversionAudit): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PrimaryConversionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryConversionAuditEngine(): PrimaryConversionAuditEngine {
  return new PrimaryConversionAuditEngine(
    [
      new PercentPrimaryConversionAuditAdjuster(-9.8),
      new CapPrimaryConversionAuditAdjuster(12703),
      new LocalePrimaryConversionAuditAdjuster(new Map<string, number>([["central", 0.9], ["east", 0.91]])),
    ],
    [],
    1.2,
    1128.1,
  );
}
