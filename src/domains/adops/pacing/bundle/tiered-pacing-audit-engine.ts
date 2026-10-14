import { TieredPacingAudit } from "./tiered-pacing-audit.js";

/** One step of the tiered pacing audit calculation. */
export interface TieredPacingAuditFactor {
  describe(): string;
  adjust(item: TieredPacingAudit, value: number): number;
}

export class TieredPacingAuditUpdatedAtOffsetAdjuster implements TieredPacingAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: TieredPacingAudit, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredTieredPacingAuditAdjuster implements TieredPacingAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPacingAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredPacingAuditAdjuster implements TieredPacingAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPacingAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered pacing audit steps in order and keeps a trace of each. */
export class TieredPacingAuditEngine {
  steps: TieredPacingAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPacingAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredPacingAudit): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TieredPacingAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredPacingAuditEngine(): TieredPacingAuditEngine {
  return new TieredPacingAuditEngine(
    [
      new TieredPacingAuditUpdatedAtOffsetAdjuster(1.92),
      new TieredTieredPacingAuditAdjuster([4293, 7091, 9432], [1.19, 1.07, 1.04]),
      new MinimumTieredPacingAuditAdjuster(23.3),
    ],
    [],
    2.9,
    14391.9,
  );
}
