import * as numbers from "../../../../kit/numbers.js";
import { CappedActivationAudit } from "./capped-activation-audit.js";

/** One step of the capped activation audit calculation. */
export interface CappedActivationAuditStep {
  describe(): string;
  adjust(item: CappedActivationAudit, value: number): number;
}

export class RoundingCappedActivationAuditAdjuster implements CappedActivationAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedActivationAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedActivationAuditAdjuster implements CappedActivationAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedActivationAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedActivationAuditCostOffsetAdjuster implements CappedActivationAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: CappedActivationAudit, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapCappedActivationAuditAdjuster implements CappedActivationAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedActivationAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedActivationAuditAdjuster implements CappedActivationAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedActivationAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped activation audit steps in order and keeps a trace of each. */
export class CappedActivationAuditEngine {
  steps: CappedActivationAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedActivationAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedActivationAudit): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: CappedActivationAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedActivationAuditEngine(): CappedActivationAuditEngine {
  return new CappedActivationAuditEngine(
    [
      new RoundingCappedActivationAuditAdjuster(5),
      new PercentCappedActivationAuditAdjuster(9.6),
      new CappedActivationAuditCostOffsetAdjuster(0.9),
      new CapCappedActivationAuditAdjuster(45201),
      new TieredCappedActivationAuditAdjuster([222, 6326, 7065, 9272], [0.96, 1.08, 0.98, 1.02]),
    ],
    [],
    0.1,
    81685.1,
  );
}
