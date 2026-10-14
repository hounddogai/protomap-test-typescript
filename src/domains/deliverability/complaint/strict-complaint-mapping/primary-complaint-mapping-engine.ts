import * as numbers from "../../../../kit/numbers.js";
import { PrimaryComplaintMapping } from "./primary-complaint-mapping.js";

/** One step of the primary complaint mapping calculation. */
export interface PrimaryComplaintMappingModifier {
  describe(): string;
  adjust(item: PrimaryComplaintMapping, value: number): number;
}

export class TieredPrimaryComplaintMappingAdjuster implements PrimaryComplaintMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryComplaintMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryComplaintMappingAdjuster implements PrimaryComplaintMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryComplaintMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPrimaryComplaintMappingAdjuster implements PrimaryComplaintMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryComplaintMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NamePrimaryComplaintMappingAdjuster implements PrimaryComplaintMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryComplaintMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary complaint mapping steps in order and keeps a trace of each. */
export class PrimaryComplaintMappingEngine {
  steps: PrimaryComplaintMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryComplaintMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryComplaintMapping): number {
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

  evaluateAll(items: PrimaryComplaintMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryComplaintMappingEngine(): PrimaryComplaintMappingEngine {
  return new PrimaryComplaintMappingEngine(
    [
      new TieredPrimaryComplaintMappingAdjuster([1038, 6956, 7617], [1, 1.12, 1.16]),
      new MinimumPrimaryComplaintMappingAdjuster(44.6),
      new CapPrimaryComplaintMappingAdjuster(47680),
      new NamePrimaryComplaintMappingAdjuster(new Map<string, number>([["online", 1.29], ["central", 1.38]])),
    ],
    [],
    3.4,
    82972.8,
  );
}
