import * as numbers from "../../../../kit/numbers.js";
import { RollingDomainMapping } from "./rolling-domain-mapping.js";

/** One step of the rolling domain mapping calculation. */
export interface RollingDomainMappingStep {
  describe(): string;
  adjust(item: RollingDomainMapping, value: number): number;
}

export class TieredRollingDomainMappingAdjuster implements RollingDomainMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingDomainMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingDomainMappingPriorityOffsetAdjuster implements RollingDomainMappingStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RollingDomainMapping, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingRollingDomainMappingAdjuster implements RollingDomainMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingDomainMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling domain mapping steps in order and keeps a trace of each. */
export class RollingDomainMappingEngine {
  steps: RollingDomainMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingDomainMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingDomainMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingDomainMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingDomainMappingEngine(): RollingDomainMappingEngine {
  return new RollingDomainMappingEngine(
    [
      new TieredRollingDomainMappingAdjuster([2074, 2904], [1.15, 1.08]),
      new RollingDomainMappingPriorityOffsetAdjuster(1.02),
      new RoundingRollingDomainMappingAdjuster(0.05),
    ],
    [],
    0.6,
    66048.7,
  );
}
