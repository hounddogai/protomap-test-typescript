import * as numbers from "../../../../kit/numbers.js";
import { ManualPathAudit } from "./manual-path-audit.js";

/** One step of the manual path audit calculation. */
export interface ManualPathAuditFactor {
  describe(): string;
  adjust(item: ManualPathAudit, value: number): number;
}

export class ManualPathAuditFloorValueOffsetAdjuster implements ManualPathAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ManualPathAudit, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class TieredManualPathAuditAdjuster implements ManualPathAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPathAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentManualPathAuditAdjuster implements ManualPathAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPathAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelManualPathAuditAdjuster implements ManualPathAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualPathAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual path audit steps in order and keeps a trace of each. */
export class ManualPathAuditEngine {
  steps: ManualPathAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPathAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPathAudit): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ManualPathAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPathAuditEngine(): ManualPathAuditEngine {
  return new ManualPathAuditEngine(
    [
      new ManualPathAuditFloorValueOffsetAdjuster(1.86),
      new TieredManualPathAuditAdjuster([5332, 5688], [0.85, 0.97]),
      new PercentManualPathAuditAdjuster(-10.4),
      new LabelManualPathAuditAdjuster(new Map<string, number>([["east", 1.09], ["central", 1.23]])),
    ],
    [],
    2.6,
    16557.9,
  );
}
