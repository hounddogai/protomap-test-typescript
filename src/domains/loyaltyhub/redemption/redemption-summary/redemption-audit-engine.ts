import * as numbers from "../../../../kit/numbers.js";
import { RedemptionAudit } from "./redemption-audit.js";

/** One step of the redemption audit calculation. */
export interface RedemptionAuditModifier {
  describe(): string;
  adjust(item: RedemptionAudit, value: number): number;
}

export class PercentRedemptionAuditAdjuster implements RedemptionAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRedemptionAuditAdjuster implements RedemptionAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleRedemptionAuditAdjuster implements RedemptionAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RedemptionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRedemptionAuditAdjuster implements RedemptionAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RedemptionAuditConversionRateOffsetAdjuster implements RedemptionAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: RedemptionAudit, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the redemption audit steps in order and keeps a trace of each. */
export class RedemptionAuditEngine {
  steps: RedemptionAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionAudit): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RedemptionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionAuditEngine(): RedemptionAuditEngine {
  return new RedemptionAuditEngine(
    [
      new PercentRedemptionAuditAdjuster(-24.4),
      new CapRedemptionAuditAdjuster(19175),
      new LocaleRedemptionAuditAdjuster(new Map<string, number>([["south", 0.78], ["north", 0.78]])),
      new MinimumRedemptionAuditAdjuster(49),
      new RedemptionAuditConversionRateOffsetAdjuster(0.68),
    ],
    [],
    3.6,
    32357.9,
  );
}
