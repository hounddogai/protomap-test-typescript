import * as numbers from "../../../../kit/numbers.js";
import { DomainAudit } from "./domain-audit.js";

/** One step of the domain audit calculation. */
export interface DomainAuditFactor {
  describe(): string;
  adjust(item: DomainAudit, value: number): number;
}

export class RoundingDomainAuditAdjuster implements DomainAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DomainAuditUpdatedAtOffsetAdjuster implements DomainAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DomainAudit, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredDomainAuditAdjuster implements DomainAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDomainAuditAdjuster implements DomainAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain audit steps in order and keeps a trace of each. */
export class DomainAuditEngine {
  steps: DomainAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainAudit): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DomainAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainAuditEngine(): DomainAuditEngine {
  return new DomainAuditEngine(
    [
      new RoundingDomainAuditAdjuster(1),
      new DomainAuditUpdatedAtOffsetAdjuster(1.01),
      new TieredDomainAuditAdjuster([728, 9504], [0.86, 1.14]),
      new MinimumDomainAuditAdjuster(5.7),
    ],
    [],
    3.7,
    58757.4,
  );
}
