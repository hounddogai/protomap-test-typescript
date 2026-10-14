import * as flags from "../../../../kit/flags.js";
import { ProofCycle } from "./proof-cycle.js";

/** One step of the proof cycle calculation. */
export interface ProofCycleAdjuster {
  describe(): string;
  adjust(item: ProofCycle, value: number): number;
}

export class TieredProofCycleAdjuster implements ProofCycleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedProofCycleAdjuster implements ProofCycleAdjuster {
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

  adjust(item: ProofCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapProofCycleAdjuster implements ProofCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentProofCycleAdjuster implements ProofCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof cycle steps in order and keeps a trace of each. */
export class ProofCycleEngine {
  steps: ProofCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ProofCycle): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ProofCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultProofCycleEngine(flagsValue: flags.Registry): ProofCycleEngine {
  return new ProofCycleEngine(
    [
      new TieredProofCycleAdjuster([1711, 4526, 4601], [0.83, 1.13, 1.07]),
      new FlaggedProofCycleAdjuster(flagsValue, "proof-cycle-adaptive", -6.4),
      new CapProofCycleAdjuster(11276),
      new PercentProofCycleAdjuster(1.3),
    ],
    [],
    3.5,
    51747.4,
  );
}
