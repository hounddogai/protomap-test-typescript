import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofMapping } from "./proof-mapping.js";

/** One step of the proof mapping calculation. */
export interface ProofMappingFactor {
  describe(): string;
  adjust(item: ProofMapping, value: number): number;
}

export class RoundingProofMappingAdjuster implements ProofMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ProofMappingRatioOffsetAdjuster implements ProofMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ProofMapping, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class MinimumProofMappingAdjuster implements ProofMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredProofMappingAdjuster implements ProofMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentProofMappingAdjuster implements ProofMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ProofMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedProofMappingAdjuster implements ProofMappingFactor {
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

  adjust(item: ProofMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof mapping steps in order and keeps a trace of each. */
export class ProofMappingEngine {
  steps: ProofMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofMapping): number {
    let current = item.netValue();
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

  evaluateAll(items: ProofMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofMappingEngine(flagsValue: flags.Registry): ProofMappingEngine {
  return new ProofMappingEngine(
    [
      new RoundingProofMappingAdjuster(1),
      new ProofMappingRatioOffsetAdjuster(1.04),
      new MinimumProofMappingAdjuster(5.3),
      new TieredProofMappingAdjuster([1655, 1918], [1, 0.93]),
      new SegmentProofMappingAdjuster(
        new Map<string, number>([["east", 1.38], ["north", 1.26], ["online", 0.89]]),
      ),
      new FlaggedProofMappingAdjuster(flagsValue, "proof-mapping-regional", -3.8),
    ],
    [],
    3,
    82782.9,
  );
}
