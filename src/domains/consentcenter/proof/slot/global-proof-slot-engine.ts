import * as numbers from "../../../../kit/numbers.js";
import { GlobalProofSlot } from "./global-proof-slot.js";

/** One step of the global proof slot calculation. */
export interface GlobalProofSlotAdjuster {
  describe(): string;
  adjust(item: GlobalProofSlot, value: number): number;
}

export class GlobalProofSlotMinimumOffsetAdjuster implements GlobalProofSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: GlobalProofSlot, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class CapGlobalProofSlotAdjuster implements GlobalProofSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalProofSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryGlobalProofSlotAdjuster implements GlobalProofSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalProofSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global proof slot steps in order and keeps a trace of each. */
export class GlobalProofSlotEngine {
  steps: GlobalProofSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalProofSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalProofSlot): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: GlobalProofSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalProofSlotEngine(): GlobalProofSlotEngine {
  return new GlobalProofSlotEngine(
    [
      new GlobalProofSlotMinimumOffsetAdjuster(1.91),
      new CapGlobalProofSlotAdjuster(22540),
      new CountryGlobalProofSlotAdjuster(new Map<string, number>([["central", 1.13]])),
    ],
    [],
    4.7,
    19701.2,
  );
}
