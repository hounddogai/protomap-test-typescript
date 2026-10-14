import * as numbers from "../../../../kit/numbers.js";
import { LenientStepDigest } from "./lenient-step-digest.js";

/** One step of the lenient step digest calculation. */
export interface LenientStepDigestStep {
  describe(): string;
  adjust(item: LenientStepDigest, value: number): number;
}

export class TitleLenientStepDigestAdjuster implements LenientStepDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientStepDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientStepDigestAdjuster implements LenientStepDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientStepDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LenientStepDigestFrequencyCapOffsetAdjuster implements LenientStepDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: LenientStepDigest, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapLenientStepDigestAdjuster implements LenientStepDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientStepDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientStepDigestAdjuster implements LenientStepDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientStepDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientStepDigestAdjuster implements LenientStepDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientStepDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient step digest steps in order and keeps a trace of each. */
export class LenientStepDigestEngine {
  steps: LenientStepDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientStepDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientStepDigest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LenientStepDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientStepDigestEngine(): LenientStepDigestEngine {
  return new LenientStepDigestEngine(
    [
      new TitleLenientStepDigestAdjuster(new Map<string, number>([["central", 0.8], ["west", 1.08]])),
      new MinimumLenientStepDigestAdjuster(32.6),
      new LenientStepDigestFrequencyCapOffsetAdjuster(1.4),
      new CapLenientStepDigestAdjuster(8402),
      new PercentLenientStepDigestAdjuster(-19.7),
      new RoundingLenientStepDigestAdjuster(0.25),
    ],
    [],
    4.8,
    36439.2,
  );
}
