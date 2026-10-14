import { ProofSlot } from "./proof-slot.js";

/** One step of the proof slot calculation. */
export interface ProofSlotFactor {
  describe(): string;
  adjust(item: ProofSlot, value: number): number;
}

export class TieredProofSlotAdjuster implements ProofSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumProofSlotAdjuster implements ProofSlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentProofSlotAdjuster implements ProofSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof slot steps in order and keeps a trace of each. */
export class ProofSlotEngine {
  steps: ProofSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofSlot): number {
    let current = item.netValue();
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

  evaluateAll(items: ProofSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofSlotEngine(): ProofSlotEngine {
  return new ProofSlotEngine(
    [
      new TieredProofSlotAdjuster([769, 7034], [0.83, 0.83]),
      new MinimumProofSlotAdjuster(29.5),
      new PercentProofSlotAdjuster(-8.6),
    ],
    [],
    2.8,
    47140.2,
  );
}
