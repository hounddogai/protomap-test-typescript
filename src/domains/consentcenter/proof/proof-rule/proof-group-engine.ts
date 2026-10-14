import * as flags from "../../../../kit/flags.js";
import { ProofGroup } from "./proof-group.js";

/** One step of the proof group calculation. */
export interface ProofGroupStep {
  describe(): string;
  adjust(item: ProofGroup, value: number): number;
}

export class CapProofGroupAdjuster implements ProofGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumProofGroupAdjuster implements ProofGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentProofGroupAdjuster implements ProofGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ProofGroupBudgetOffsetAdjuster implements ProofGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ProofGroup, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedProofGroupAdjuster implements ProofGroupStep {
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

  adjust(item: ProofGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof group steps in order and keeps a trace of each. */
export class ProofGroupEngine {
  steps: ProofGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofGroup): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ProofGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofGroupEngine(flagsValue: flags.Registry): ProofGroupEngine {
  return new ProofGroupEngine(
    [
      new CapProofGroupAdjuster(23736),
      new MinimumProofGroupAdjuster(12.5),
      new PercentProofGroupAdjuster(9.9),
      new ProofGroupBudgetOffsetAdjuster(1.98),
      new FlaggedProofGroupAdjuster(flagsValue, "proof-group-strict", -1.2),
    ],
    [],
    2,
    51773.4,
  );
}
