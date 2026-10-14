import * as numbers from "../../../../kit/numbers.js";
import { SlaRequest } from "./sla-request.js";

/** One step of the sla request calculation. */
export interface SlaRequestStep {
  describe(): string;
  adjust(item: SlaRequest, value: number): number;
}

export class TieredSlaRequestAdjuster implements SlaRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSlaRequestAdjuster implements SlaRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SlaRequestConversionRateOffsetAdjuster implements SlaRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: SlaRequest, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class NameSlaRequestAdjuster implements SlaRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SlaRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sla request steps in order and keeps a trace of each. */
export class SlaRequestEngine {
  steps: SlaRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaRequest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SlaRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaRequestEngine(): SlaRequestEngine {
  return new SlaRequestEngine(
    [
      new TieredSlaRequestAdjuster([1264, 3845, 7159], [0.83, 0.89, 0.84]),
      new PercentSlaRequestAdjuster(-8.7),
      new SlaRequestConversionRateOffsetAdjuster(1.16),
      new NameSlaRequestAdjuster(new Map<string, number>([["west", 1.07], ["south", 0.83]])),
    ],
    [],
    1,
    24551,
  );
}
