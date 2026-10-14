import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofMilestone } from "./proof-milestone.js";

/** One step of the proof milestone calculation. */
export interface ProofMilestoneModifier {
  describe(): string;
  adjust(item: ProofMilestone, value: number): number;
}

export class TieredProofMilestoneAdjuster implements ProofMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapProofMilestoneAdjuster implements ProofMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedProofMilestoneAdjuster implements ProofMilestoneModifier {
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

  adjust(item: ProofMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof milestone steps in order and keeps a trace of each. */
export class ProofMilestoneEngine {
  steps: ProofMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofMilestone): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ProofMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofMilestoneEngine(flagsValue: flags.Registry): ProofMilestoneEngine {
  return new ProofMilestoneEngine(
    [
      new TieredProofMilestoneAdjuster([1515, 5350, 6910], [0.91, 0.89, 0.84]),
      new CapProofMilestoneAdjuster(15326),
      new FlaggedProofMilestoneAdjuster(flagsValue, "proof-milestone-rolling", -9.6),
    ],
    [],
    2.4,
    23882.1,
  );
}
