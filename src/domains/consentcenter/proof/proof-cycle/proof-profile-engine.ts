import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofProfile } from "./proof-profile.js";

/** One step of the proof profile calculation. */
export interface ProofProfileAdjuster {
  describe(): string;
  adjust(item: ProofProfile, value: number): number;
}

export class PercentProofProfileAdjuster implements ProofProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedProofProfileAdjuster implements ProofProfileAdjuster {
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

  adjust(item: ProofProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumProofProfileAdjuster implements ProofProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelProofProfileAdjuster implements ProofProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ProofProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ProofProfileGraceDaysOffsetAdjuster implements ProofProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ProofProfile, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the proof profile steps in order and keeps a trace of each. */
export class ProofProfileEngine {
  steps: ProofProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ProofProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofProfileEngine(flagsValue: flags.Registry): ProofProfileEngine {
  return new ProofProfileEngine(
    [
      new PercentProofProfileAdjuster(5.6),
      new FlaggedProofProfileAdjuster(flagsValue, "proof-profile-capped", 9.7),
      new MinimumProofProfileAdjuster(0),
      new LabelProofProfileAdjuster(new Map<string, number>([["online", 1.17]])),
      new ProofProfileGraceDaysOffsetAdjuster(0.93),
    ],
    [],
    4.6,
    61661.5,
  );
}
