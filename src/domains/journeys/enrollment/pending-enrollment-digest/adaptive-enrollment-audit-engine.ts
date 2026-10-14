import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

/** One step of the adaptive enrollment audit calculation. */
export interface AdaptiveEnrollmentAuditFactor {
  describe(): string;
  adjust(item: AdaptiveEnrollmentAudit, value: number): number;
}

export class NameAdaptiveEnrollmentAuditAdjuster implements AdaptiveEnrollmentAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveEnrollmentAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapAdaptiveEnrollmentAuditAdjuster implements AdaptiveEnrollmentAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveEnrollmentAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingAdaptiveEnrollmentAuditAdjuster implements AdaptiveEnrollmentAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveEnrollmentAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveEnrollmentAuditRetriesOffsetAdjuster implements AdaptiveEnrollmentAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: AdaptiveEnrollmentAudit, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredAdaptiveEnrollmentAuditAdjuster implements AdaptiveEnrollmentAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveEnrollmentAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive enrollment audit steps in order and keeps a trace of each. */
export class AdaptiveEnrollmentAuditEngine {
  steps: AdaptiveEnrollmentAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEnrollmentAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveEnrollmentAudit): number {
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

  evaluateAll(items: AdaptiveEnrollmentAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveEnrollmentAuditEngine(): AdaptiveEnrollmentAuditEngine {
  return new AdaptiveEnrollmentAuditEngine(
    [
      new NameAdaptiveEnrollmentAuditAdjuster(
        new Map<string, number>([["retail", 0.75], ["online", 1.14], ["north", 1.22]]),
      ),
      new CapAdaptiveEnrollmentAuditAdjuster(37433),
      new RoundingAdaptiveEnrollmentAuditAdjuster(1),
      new AdaptiveEnrollmentAuditRetriesOffsetAdjuster(0.87),
      new TieredAdaptiveEnrollmentAuditAdjuster([7358, 9692, 9810], [1.02, 0.89, 0.8]),
    ],
    [],
    3.5,
    44136.2,
  );
}
