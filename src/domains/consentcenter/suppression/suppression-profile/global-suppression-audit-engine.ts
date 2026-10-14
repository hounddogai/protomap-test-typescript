import * as numbers from "../../../../kit/numbers.js";
import { GlobalSuppressionAudit } from "./global-suppression-audit.js";

/** One step of the global suppression audit calculation. */
export interface GlobalSuppressionAuditStep {
  describe(): string;
  adjust(item: GlobalSuppressionAudit, value: number): number;
}

export class MinimumGlobalSuppressionAuditAdjuster implements GlobalSuppressionAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSuppressionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalSuppressionAuditAdjuster implements GlobalSuppressionAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSuppressionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalSuppressionAuditAdjuster implements GlobalSuppressionAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSuppressionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global suppression audit steps in order and keeps a trace of each. */
export class GlobalSuppressionAuditEngine {
  steps: GlobalSuppressionAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSuppressionAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalSuppressionAudit): number {
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

  evaluateAll(items: GlobalSuppressionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalSuppressionAuditEngine(): GlobalSuppressionAuditEngine {
  return new GlobalSuppressionAuditEngine(
    [
      new MinimumGlobalSuppressionAuditAdjuster(30.6),
      new PercentGlobalSuppressionAuditAdjuster(-11.8),
      new TieredGlobalSuppressionAuditAdjuster([3511, 6126, 7351, 9496], [1.08, 1.08, 0.91, 0.91]),
    ],
    [],
    4.2,
    29576.7,
  );
}
