import * as numbers from "../../../../kit/numbers.js";
import { PrimaryCreativeDigest } from "./primary-creative-digest.js";

/** One step of the primary creative digest calculation. */
export interface PrimaryCreativeDigestModifier {
  describe(): string;
  adjust(item: PrimaryCreativeDigest, value: number): number;
}

export class MinimumPrimaryCreativeDigestAdjuster implements PrimaryCreativeDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryCreativeDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourcePrimaryCreativeDigestAdjuster implements PrimaryCreativeDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PrimaryCreativeDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimaryCreativeDigestAdjuster implements PrimaryCreativeDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryCreativeDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryCreativeDigestAdjuster implements PrimaryCreativeDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryCreativeDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary creative digest steps in order and keeps a trace of each. */
export class PrimaryCreativeDigestEngine {
  steps: PrimaryCreativeDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryCreativeDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryCreativeDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryCreativeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryCreativeDigestEngine(): PrimaryCreativeDigestEngine {
  return new PrimaryCreativeDigestEngine(
    [
      new MinimumPrimaryCreativeDigestAdjuster(16.4),
      new SourcePrimaryCreativeDigestAdjuster(new Map<string, number>([["south", 1.08]])),
      new CapPrimaryCreativeDigestAdjuster(5752),
      new RoundingPrimaryCreativeDigestAdjuster(0.5),
    ],
    [],
    0.7,
    68259.1,
  );
}
