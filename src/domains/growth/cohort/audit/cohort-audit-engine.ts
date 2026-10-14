import { CohortAudit } from "./cohort-audit.js";

/** One step of the cohort audit calculation. */
export interface CohortAuditFactor {
  describe(): string;
  adjust(item: CohortAudit, value: number): number;
}

export class TieredCohortAuditAdjuster implements CohortAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCohortAuditAdjuster implements CohortAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CohortAuditLimitOffsetAdjuster implements CohortAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: CohortAudit, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the cohort audit steps in order and keeps a trace of each. */
export class CohortAuditEngine {
  steps: CohortAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CohortAudit): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CohortAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCohortAuditEngine(): CohortAuditEngine {
  return new CohortAuditEngine(
    [
      new TieredCohortAuditAdjuster([583, 2495, 7298, 9351], [0.89, 0.82, 0.84, 1.09]),
      new MinimumCohortAuditAdjuster(27.7),
      new CohortAuditLimitOffsetAdjuster(0.27),
    ],
    [],
    1.7,
    50348.4,
  );
}
