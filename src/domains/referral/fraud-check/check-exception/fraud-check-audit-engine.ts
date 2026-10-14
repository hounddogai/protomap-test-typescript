import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckAudit } from "./fraud-check-audit.js";

/** One step of the fraud check audit calculation. */
export interface FraudCheckAuditAdjuster {
  describe(): string;
  adjust(item: FraudCheckAudit, value: number): number;
}

export class FlaggedFraudCheckAuditAdjuster implements FraudCheckAuditAdjuster {
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

  adjust(item: FraudCheckAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFraudCheckAuditAdjuster implements FraudCheckAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFraudCheckAuditAdjuster implements FraudCheckAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelFraudCheckAuditAdjuster implements FraudCheckAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FraudCheckAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fraud check audit steps in order and keeps a trace of each. */
export class FraudCheckAuditEngine {
  steps: FraudCheckAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckAudit): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: FraudCheckAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckAuditEngine(flagsValue: flags.Registry): FraudCheckAuditEngine {
  return new FraudCheckAuditEngine(
    [
      new FlaggedFraudCheckAuditAdjuster(flagsValue, "fraud-check-audit-scheduled", 8.2),
      new PercentFraudCheckAuditAdjuster(-8.7),
      new TieredFraudCheckAuditAdjuster([6251, 8242], [0.83, 0.83]),
      new LabelFraudCheckAuditAdjuster(new Map<string, number>([["central", 0.94]])),
    ],
    [],
    0.4,
    82918.3,
  );
}
