import * as numbers from "../../../../kit/numbers.js";
import { RegionalDomainCycle } from "./regional-domain-cycle.js";

/** One step of the regional domain cycle calculation. */
export interface RegionalDomainCycleModifier {
  describe(): string;
  adjust(item: RegionalDomainCycle, value: number): number;
}

export class TieredRegionalDomainCycleAdjuster implements RegionalDomainCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalDomainCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionalDomainCycleBudgetOffsetAdjuster implements RegionalDomainCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: RegionalDomainCycle, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingRegionalDomainCycleAdjuster implements RegionalDomainCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalDomainCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional domain cycle steps in order and keeps a trace of each. */
export class RegionalDomainCycleEngine {
  steps: RegionalDomainCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalDomainCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalDomainCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RegionalDomainCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalDomainCycleEngine(): RegionalDomainCycleEngine {
  return new RegionalDomainCycleEngine(
    [
      new TieredRegionalDomainCycleAdjuster([2631, 5176, 9766], [0.89, 1.15, 1.17]),
      new RegionalDomainCycleBudgetOffsetAdjuster(1.31),
      new RoundingRegionalDomainCycleAdjuster(1),
    ],
    [],
    1,
    42443.8,
  );
}
