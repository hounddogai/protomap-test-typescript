import * as numbers from "../../../../kit/numbers.js";
import { TieredCohortAudit } from "./tiered-cohort-audit.js";

/** One step of the tiered cohort audit calculation. */
export interface TieredCohortAuditStep {
  describe(): string;
  adjust(item: TieredCohortAudit, value: number): number;
}

export class MinimumTieredCohortAuditAdjuster implements TieredCohortAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredCohortAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryTieredCohortAuditAdjuster implements TieredCohortAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredCohortAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredCohortAuditAdjuster implements TieredCohortAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCohortAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredCohortAuditAdjuster implements TieredCohortAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCohortAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered cohort audit steps in order and keeps a trace of each. */
export class TieredCohortAuditEngine {
  steps: TieredCohortAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCohortAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredCohortAudit): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredCohortAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredCohortAuditEngine(): TieredCohortAuditEngine {
  return new TieredCohortAuditEngine(
    [
      new MinimumTieredCohortAuditAdjuster(35),
      new CountryTieredCohortAuditAdjuster(
        new Map<string, number>([["north", 0.97], ["south", 1.1], ["central", 0.8]]),
      ),
      new CapTieredCohortAuditAdjuster(42987),
      new RoundingTieredCohortAuditAdjuster(1),
    ],
    [],
    2.9,
    66824.8,
  );
}
