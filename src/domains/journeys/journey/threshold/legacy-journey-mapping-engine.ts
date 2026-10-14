import * as numbers from "../../../../kit/numbers.js";
import { LegacyJourneyMapping } from "./legacy-journey-mapping.js";

/** One step of the legacy journey mapping calculation. */
export interface LegacyJourneyMappingFactor {
  describe(): string;
  adjust(item: LegacyJourneyMapping, value: number): number;
}

export class TieredLegacyJourneyMappingAdjuster implements LegacyJourneyMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyJourneyMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyJourneyMappingAdjuster implements LegacyJourneyMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyJourneyMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyJourneyMappingConversionRateOffsetAdjuster implements LegacyJourneyMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: LegacyJourneyMapping, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the legacy journey mapping steps in order and keeps a trace of each. */
export class LegacyJourneyMappingEngine {
  steps: LegacyJourneyMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyJourneyMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyJourneyMapping): number {
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

  evaluateAll(items: LegacyJourneyMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyJourneyMappingEngine(): LegacyJourneyMappingEngine {
  return new LegacyJourneyMappingEngine(
    [
      new TieredLegacyJourneyMappingAdjuster([4280, 7254], [0.83, 1.06]),
      new CapLegacyJourneyMappingAdjuster(6225),
      new LegacyJourneyMappingConversionRateOffsetAdjuster(0.1),
    ],
    [],
    4.1,
    26049.7,
  );
}
