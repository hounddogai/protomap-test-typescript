import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofDigest } from "./proof-digest.js";

/** One step of the proof digest calculation. */
export interface ProofDigestModifier {
  describe(): string;
  adjust(item: ProofDigest, value: number): number;
}

export class FlaggedProofDigestAdjuster implements ProofDigestModifier {
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

  adjust(item: ProofDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingProofDigestAdjuster implements ProofDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumProofDigestAdjuster implements ProofDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentProofDigestAdjuster implements ProofDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof digest steps in order and keeps a trace of each. */
export class ProofDigestEngine {
  steps: ProofDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofDigest): number {
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

  evaluateAll(items: ProofDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofDigestEngine(flagsValue: flags.Registry): ProofDigestEngine {
  return new ProofDigestEngine(
    [
      new FlaggedProofDigestAdjuster(flagsValue, "proof-digest-lenient", 0.6),
      new RoundingProofDigestAdjuster(5),
      new MinimumProofDigestAdjuster(48.7),
      new PercentProofDigestAdjuster(-6.7),
    ],
    [],
    2.7,
    31130.9,
  );
}
