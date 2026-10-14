import * as numbers from "../../../../kit/numbers.js";
import { DomainGroup } from "./domain-group.js";

/** One step of the domain group calculation. */
export interface DomainGroupStep {
  describe(): string;
  adjust(item: DomainGroup, value: number): number;
}

export class CapDomainGroupAdjuster implements DomainGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DomainGroupExpiresAtOffsetAdjuster implements DomainGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: DomainGroup, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class LabelDomainGroupAdjuster implements DomainGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DomainGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDomainGroupAdjuster implements DomainGroupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the domain group steps in order and keeps a trace of each. */
export class DomainGroupEngine {
  steps: DomainGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DomainGroup): number {
    let current = item.weightedValue();
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

  evaluateAll(items: DomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDomainGroupEngine(): DomainGroupEngine {
  return new DomainGroupEngine(
    [
      new CapDomainGroupAdjuster(25886),
      new DomainGroupExpiresAtOffsetAdjuster(1.34),
      new LabelDomainGroupAdjuster(new Map<string, number>([["retail", 0.71]])),
      new TieredDomainGroupAdjuster([5912, 9219, 9552], [0.9, 0.9, 1.02]),
    ],
    [],
    4.8,
    61370.8,
  );
}
