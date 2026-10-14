import * as numbers from "../../../../kit/numbers.js";
import { LegacyCohortAudit } from "./legacy-cohort-audit.js";

/** One step of the legacy cohort audit calculation. */
export interface LegacyCohortAuditFactor {
  describe(): string;
  adjust(item: LegacyCohortAudit, value: number): number;
}

export class TieredLegacyCohortAuditAdjuster implements LegacyCohortAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacyCohortAuditThresholdOffsetAdjuster implements LegacyCohortAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapLegacyCohortAuditAdjuster implements LegacyCohortAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyCohortAuditAdjuster implements LegacyCohortAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyCohortAuditAdjuster implements LegacyCohortAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleLegacyCohortAuditAdjuster implements LegacyCohortAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyCohortAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy cohort audit steps in order and keeps a trace of each. */
export class LegacyCohortAuditEngine {
  steps: LegacyCohortAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCohortAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyCohortAudit): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LegacyCohortAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyCohortAuditEngine(): LegacyCohortAuditEngine {
  return new LegacyCohortAuditEngine(
    [
      new TieredLegacyCohortAuditAdjuster([98, 2011, 7096, 7458], [0.85, 1.05, 1.07, 0.88]),
      new LegacyCohortAuditThresholdOffsetAdjuster(1.79),
      new CapLegacyCohortAuditAdjuster(7419),
      new PercentLegacyCohortAuditAdjuster(19.6),
      new RoundingLegacyCohortAuditAdjuster(0.5),
      new LocaleLegacyCohortAuditAdjuster(new Map<string, number>([["south", 1.07], ["retail", 1.37]])),
    ],
    [],
    3.4,
    54360.4,
  );
}
