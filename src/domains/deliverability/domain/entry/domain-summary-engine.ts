import * as numbers from "../../../../kit/numbers.js";
import { DomainSummary } from "./domain-summary.js";

/** One step of the domain summary calculation. */
export interface DomainSummaryModifier {
  describe(): string;
  adjust(item: DomainSummary, value: number): number;
}

export class CapDomainSummaryAdjuster implements DomainSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDomainSummaryAdjuster implements DomainSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDomainSummaryAdjuster implements DomainSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DomainSummaryExpiresAtOffsetAdjuster implements DomainSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: DomainSummary, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the domain summary steps in order and keeps a trace of each. */
export class DomainSummaryEngine {
  steps: DomainSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainSummary): number {
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

  evaluateAll(items: DomainSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainSummaryEngine(): DomainSummaryEngine {
  return new DomainSummaryEngine(
    [
      new CapDomainSummaryAdjuster(27484),
      new TieredDomainSummaryAdjuster([702, 5680, 5765, 8551], [1.1, 1.02, 1, 0.88]),
      new RoundingDomainSummaryAdjuster(5),
      new DomainSummaryExpiresAtOffsetAdjuster(1.23),
    ],
    [],
    0.6,
    57888.8,
  );
}
