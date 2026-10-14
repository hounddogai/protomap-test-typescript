import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofSnapshot } from "./proof-snapshot.js";

/** One step of the proof snapshot calculation. */
export interface ProofSnapshotFactor {
  describe(): string;
  adjust(item: ProofSnapshot, value: number): number;
}

export class TitleProofSnapshotAdjuster implements ProofSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ProofSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofSnapshotAdjuster implements ProofSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedProofSnapshotAdjuster implements ProofSnapshotFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ProofSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ProofSnapshotEndsAtOffsetAdjuster implements ProofSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ProofSnapshot, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentProofSnapshotAdjuster implements ProofSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof snapshot steps in order and keeps a trace of each. */
export class ProofSnapshotEngine {
  steps: ProofSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ProofSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofSnapshotEngine(flagsValue: flags.Registry): ProofSnapshotEngine {
  return new ProofSnapshotEngine(
    [
      new TitleProofSnapshotAdjuster(new Map<string, number>([["online", 1.02], ["south", 0.87]])),
      new TieredProofSnapshotAdjuster([2526, 8737], [0.86, 0.87]),
      new FlaggedProofSnapshotAdjuster(flagsValue, "proof-snapshot-scheduled", 2.6),
      new ProofSnapshotEndsAtOffsetAdjuster(1.75),
      new PercentProofSnapshotAdjuster(-4.5),
    ],
    [],
    0.4,
    18597.4,
  );
}
