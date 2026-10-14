import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofOverride } from "./proof-override.js";

/** One step of the proof override calculation. */
export interface ProofOverrideAdjuster {
  describe(): string;
  adjust(item: ProofOverride, value: number): number;
}

export class ChannelProofOverrideAdjuster implements ProofOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ProofOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingProofOverrideAdjuster implements ProofOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapProofOverrideAdjuster implements ProofOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumProofOverrideAdjuster implements ProofOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredProofOverrideAdjuster implements ProofOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedProofOverrideAdjuster implements ProofOverrideAdjuster {
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

  adjust(item: ProofOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the proof override steps in order and keeps a trace of each. */
export class ProofOverrideEngine {
  steps: ProofOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofOverride): number {
    let current = item.netLoad();
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

  evaluateAll(items: ProofOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofOverrideEngine(flagsValue: flags.Registry): ProofOverrideEngine {
  return new ProofOverrideEngine(
    [
      new ChannelProofOverrideAdjuster(
        new Map<string, number>([["central", 1.12], ["retail", 1.11], ["west", 1.23]]),
      ),
      new RoundingProofOverrideAdjuster(0.25),
      new CapProofOverrideAdjuster(3412),
      new MinimumProofOverrideAdjuster(27.9),
      new TieredProofOverrideAdjuster([3380, 5600, 6962, 7963], [1.04, 1.1, 0.98, 0.95]),
      new FlaggedProofOverrideAdjuster(flagsValue, "proof-override-rolling", 0.6),
    ],
    [],
    4.6,
    49353.7,
  );
}
