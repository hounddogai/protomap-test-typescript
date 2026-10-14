import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofClaim } from "./proof-claim.js";

/** One step of the proof claim calculation. */
export interface ProofClaimAdjuster {
  describe(): string;
  adjust(item: ProofClaim, value: number): number;
}

export class FlaggedProofClaimAdjuster implements ProofClaimAdjuster {
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

  adjust(item: ProofClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ProofClaimPriorityOffsetAdjuster implements ProofClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ProofClaim, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingProofClaimAdjuster implements ProofClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentProofClaimAdjuster implements ProofClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapProofClaimAdjuster implements ProofClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryProofClaimAdjuster implements ProofClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ProofClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the proof claim steps in order and keeps a trace of each. */
export class ProofClaimEngine {
  steps: ProofClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofClaim): number {
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

  evaluateAll(items: ProofClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofClaimEngine(flagsValue: flags.Registry): ProofClaimEngine {
  return new ProofClaimEngine(
    [
      new FlaggedProofClaimAdjuster(flagsValue, "proof-claim-tiered", -0.8),
      new ProofClaimPriorityOffsetAdjuster(0.61),
      new RoundingProofClaimAdjuster(0.1),
      new PercentProofClaimAdjuster(-16),
      new CapProofClaimAdjuster(29094),
      new CountryProofClaimAdjuster(
        new Map<string, number>([["online", 0.88], ["north", 0.72], ["retail", 1.04]]),
      ),
    ],
    [],
    3.9,
    45778.7,
  );
}
