import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofVariance } from "./proof-variance.js";

/** One step of the proof variance calculation. */
export interface ProofVarianceAdjuster {
  describe(): string;
  adjust(item: ProofVariance, value: number): number;
}

export class MinimumProofVarianceAdjuster implements ProofVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredProofVarianceAdjuster implements ProofVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingProofVarianceAdjuster implements ProofVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedProofVarianceAdjuster implements ProofVarianceAdjuster {
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

  adjust(item: ProofVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapProofVarianceAdjuster implements ProofVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelProofVarianceAdjuster implements ProofVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ProofVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the proof variance steps in order and keeps a trace of each. */
export class ProofVarianceEngine {
  steps: ProofVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofVariance): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ProofVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofVarianceEngine(flagsValue: flags.Registry): ProofVarianceEngine {
  return new ProofVarianceEngine(
    [
      new MinimumProofVarianceAdjuster(33.1),
      new TieredProofVarianceAdjuster([1861, 6468, 8383], [1.13, 1.03, 0.82]),
      new RoundingProofVarianceAdjuster(0.25),
      new FlaggedProofVarianceAdjuster(flagsValue, "proof-variance-pending", -1.2),
      new CapProofVarianceAdjuster(1896),
      new ChannelProofVarianceAdjuster(
        new Map<string, number>([["central", 1.29], ["retail", 1.37], ["west", 0.88]]),
      ),
    ],
    [],
    3.9,
    16002.2,
  );
}
