import * as flags from "../../../../kit/flags.js";
import { ProofException } from "./proof-exception.js";

/** One step of the proof exception calculation. */
export interface ProofExceptionStep {
  describe(): string;
  adjust(item: ProofException, value: number): number;
}

export class CapProofExceptionAdjuster implements ProofExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedProofExceptionAdjuster implements ProofExceptionStep {
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

  adjust(item: ProofException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentProofExceptionAdjuster implements ProofExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleProofExceptionAdjuster implements ProofExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ProofException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofExceptionAdjuster implements ProofExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the proof exception steps in order and keeps a trace of each. */
export class ProofExceptionEngine {
  steps: ProofExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ProofException): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ProofException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultProofExceptionEngine(flagsValue: flags.Registry): ProofExceptionEngine {
  return new ProofExceptionEngine(
    [
      new CapProofExceptionAdjuster(35709),
      new FlaggedProofExceptionAdjuster(flagsValue, "proof-exception-tiered", -0),
      new PercentProofExceptionAdjuster(18.1),
      new TitleProofExceptionAdjuster(
        new Map<string, number>([["north", 1.11], ["online", 0.84], ["west", 0.79]]),
      ),
      new TieredProofExceptionAdjuster([5571, 8890], [1.14, 0.81]),
    ],
    [],
    0.2,
    56577.4,
  );
}
