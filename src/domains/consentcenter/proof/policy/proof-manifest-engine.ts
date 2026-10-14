import * as numbers from "../../../../kit/numbers.js";
import { ProofManifest } from "./proof-manifest.js";

/** One step of the proof manifest calculation. */
export interface ProofManifestAdjuster {
  describe(): string;
  adjust(item: ProofManifest, value: number): number;
}

export class TitleProofManifestAdjuster implements ProofManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ProofManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofManifestAdjuster implements ProofManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapProofManifestAdjuster implements ProofManifestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof manifest steps in order and keeps a trace of each. */
export class ProofManifestEngine {
  steps: ProofManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofManifest): number {
    let current = item.netTotal();
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

  evaluateAll(items: ProofManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofManifestEngine(): ProofManifestEngine {
  return new ProofManifestEngine(
    [
      new TitleProofManifestAdjuster(new Map<string, number>([["central", 0.86], ["west", 1.13]])),
      new TieredProofManifestAdjuster([1304, 2473, 4610, 5283], [0.94, 1.16, 0.94, 1.04]),
      new CapProofManifestAdjuster(13343),
    ],
    [],
    4.1,
    88432,
  );
}
