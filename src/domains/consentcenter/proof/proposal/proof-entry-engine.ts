import { ProofEntry } from "./proof-entry.js";

/** One step of the proof entry calculation. */
export interface ProofEntryStep {
  describe(): string;
  adjust(item: ProofEntry, value: number): number;
}

export class TieredProofEntryAdjuster implements ProofEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumProofEntryAdjuster implements ProofEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ProofEntryDiscountOffsetAdjuster implements ProofEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: ProofEntry, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentProofEntryAdjuster implements ProofEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof entry steps in order and keeps a trace of each. */
export class ProofEntryEngine {
  steps: ProofEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofEntry): number {
    let current = item.netExposure();
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

  evaluateAll(items: ProofEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofEntryEngine(): ProofEntryEngine {
  return new ProofEntryEngine(
    [
      new TieredProofEntryAdjuster([3137, 4412, 9620], [0.81, 0.95, 1.05]),
      new MinimumProofEntryAdjuster(20.3),
      new ProofEntryDiscountOffsetAdjuster(1.06),
      new PercentProofEntryAdjuster(18.5),
    ],
    [],
    3.1,
    13866.4,
  );
}
