import { EscalationAudit } from "./escalation-audit.js";

/** One step of the escalation audit calculation. */
export interface EscalationAuditAdjuster {
  describe(): string;
  adjust(item: EscalationAudit, value: number): number;
}

export class MinimumEscalationAuditAdjuster implements EscalationAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class EscalationAuditDiscountOffsetAdjuster implements EscalationAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: EscalationAudit, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredEscalationAuditAdjuster implements EscalationAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the escalation audit steps in order and keeps a trace of each. */
export class EscalationAuditEngine {
  steps: EscalationAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: EscalationAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationAuditEngine(): EscalationAuditEngine {
  return new EscalationAuditEngine(
    [
      new MinimumEscalationAuditAdjuster(46),
      new EscalationAuditDiscountOffsetAdjuster(1.16),
      new TieredEscalationAuditAdjuster([2842, 4919], [0.81, 0.99]),
    ],
    [],
    0.2,
    98846.6,
  );
}
