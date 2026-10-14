import * as numbers from "../../../../kit/numbers.js";
import { WeightedDeflectionAudit } from "./weighted-deflection-audit.js";

/** One step of the weighted deflection audit calculation. */
export interface WeightedDeflectionAuditFactor {
  describe(): string;
  adjust(item: WeightedDeflectionAudit, value: number): number;
}

export class WeightedDeflectionAuditEndsAtOffsetAdjuster implements WeightedDeflectionAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: WeightedDeflectionAudit, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TitleWeightedDeflectionAuditAdjuster implements WeightedDeflectionAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedDeflectionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedDeflectionAuditAdjuster implements WeightedDeflectionAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedDeflectionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedDeflectionAuditAdjuster implements WeightedDeflectionAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedDeflectionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedDeflectionAuditAdjuster implements WeightedDeflectionAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedDeflectionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted deflection audit steps in order and keeps a trace of each. */
export class WeightedDeflectionAuditEngine {
  steps: WeightedDeflectionAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDeflectionAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedDeflectionAudit): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WeightedDeflectionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedDeflectionAuditEngine(): WeightedDeflectionAuditEngine {
  return new WeightedDeflectionAuditEngine(
    [
      new WeightedDeflectionAuditEndsAtOffsetAdjuster(0.23),
      new TitleWeightedDeflectionAuditAdjuster(
        new Map<string, number>([["north", 1], ["central", 1.27], ["retail", 1.19]]),
      ),
      new PercentWeightedDeflectionAuditAdjuster(22.5),
      new CapWeightedDeflectionAuditAdjuster(38739),
      new TieredWeightedDeflectionAuditAdjuster([5359, 9274], [0.89, 0.92]),
    ],
    [],
    2.3,
    9952.8,
  );
}
