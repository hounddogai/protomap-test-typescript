import * as numbers from "../../../../kit/numbers.js";
import { CsatAssignment } from "./csat-assignment.js";

/** One step of the csat assignment calculation. */
export interface CsatAssignmentAdjuster {
  describe(): string;
  adjust(item: CsatAssignment, value: number): number;
}

export class CsatAssignmentRateOffsetAdjuster implements CsatAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: CsatAssignment, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class SourceCsatAssignmentAdjuster implements CsatAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: CsatAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCsatAssignmentAdjuster implements CsatAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the csat assignment steps in order and keeps a trace of each. */
export class CsatAssignmentEngine {
  steps: CsatAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CsatAssignment): number {
    let current = item.netVolume();
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

  evaluateAll(items: CsatAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCsatAssignmentEngine(): CsatAssignmentEngine {
  return new CsatAssignmentEngine(
    [
      new CsatAssignmentRateOffsetAdjuster(0.78),
      new SourceCsatAssignmentAdjuster(
        new Map<string, number>([["south", 1.03], ["retail", 0.77], ["north", 1.17]]),
      ),
      new TieredCsatAssignmentAdjuster([6790, 9766], [0.94, 1.19]),
    ],
    [],
    2.7,
    18919.3,
  );
}
