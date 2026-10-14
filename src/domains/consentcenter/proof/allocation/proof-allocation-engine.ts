import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofAllocation } from "./proof-allocation.js";

/** One step of the proof allocation calculation. */
export interface ProofAllocationModifier {
  describe(): string;
  adjust(item: ProofAllocation, value: number): number;
}

export class PercentProofAllocationAdjuster implements ProofAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapProofAllocationAdjuster implements ProofAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingProofAllocationAdjuster implements ProofAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleProofAllocationAdjuster implements ProofAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ProofAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumProofAllocationAdjuster implements ProofAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedProofAllocationAdjuster implements ProofAllocationModifier {
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

  adjust(item: ProofAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof allocation steps in order and keeps a trace of each. */
export class ProofAllocationEngine {
  steps: ProofAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofAllocation): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ProofAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofAllocationEngine(flagsValue: flags.Registry): ProofAllocationEngine {
  return new ProofAllocationEngine(
    [
      new PercentProofAllocationAdjuster(7.5),
      new CapProofAllocationAdjuster(40547),
      new RoundingProofAllocationAdjuster(0.1),
      new LocaleProofAllocationAdjuster(new Map<string, number>([["west", 1.05]])),
      new MinimumProofAllocationAdjuster(8.4),
      new FlaggedProofAllocationAdjuster(flagsValue, "proof-allocation-default", 3.4),
    ],
    [],
    0.3,
    24632.2,
  );
}
