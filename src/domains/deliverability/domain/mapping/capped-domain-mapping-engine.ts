import * as numbers from "../../../../kit/numbers.js";
import { CappedDomainMapping } from "./capped-domain-mapping.js";

/** One step of the capped domain mapping calculation. */
export interface CappedDomainMappingFactor {
  describe(): string;
  adjust(item: CappedDomainMapping, value: number): number;
}

export class MinimumCappedDomainMappingAdjuster implements CappedDomainMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedDomainMappingAdjuster implements CappedDomainMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedDomainMappingAdjuster implements CappedDomainMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCappedDomainMappingAdjuster implements CappedDomainMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedDomainMappingAdjuster implements CappedDomainMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedDomainMappingMaximumOffsetAdjuster implements CappedDomainMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: CappedDomainMapping, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the capped domain mapping steps in order and keeps a trace of each. */
export class CappedDomainMappingEngine {
  steps: CappedDomainMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDomainMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedDomainMapping): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: CappedDomainMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedDomainMappingEngine(): CappedDomainMappingEngine {
  return new CappedDomainMappingEngine(
    [
      new MinimumCappedDomainMappingAdjuster(44.9),
      new PercentCappedDomainMappingAdjuster(7.8),
      new RoundingCappedDomainMappingAdjuster(0.05),
      new CapCappedDomainMappingAdjuster(13248),
      new TieredCappedDomainMappingAdjuster([3244, 6526], [0.87, 0.94]),
      new CappedDomainMappingMaximumOffsetAdjuster(1.14),
    ],
    [],
    0.7,
    46428.1,
  );
}
