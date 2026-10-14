import { DefaultEnrollmentDigest } from "./default-enrollment-digest.js";

/** One step of the default enrollment digest calculation. */
export interface DefaultEnrollmentDigestModifier {
  describe(): string;
  adjust(item: DefaultEnrollmentDigest, value: number): number;
}

export class MinimumDefaultEnrollmentDigestAdjuster implements DefaultEnrollmentDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultEnrollmentDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultEnrollmentDigestAdjuster implements DefaultEnrollmentDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultEnrollmentDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentDefaultEnrollmentDigestAdjuster implements DefaultEnrollmentDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DefaultEnrollmentDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default enrollment digest steps in order and keeps a trace of each. */
export class DefaultEnrollmentDigestEngine {
  steps: DefaultEnrollmentDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultEnrollmentDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultEnrollmentDigest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: DefaultEnrollmentDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultEnrollmentDigestEngine(): DefaultEnrollmentDigestEngine {
  return new DefaultEnrollmentDigestEngine(
    [
      new MinimumDefaultEnrollmentDigestAdjuster(18.9),
      new CapDefaultEnrollmentDigestAdjuster(27323),
      new SegmentDefaultEnrollmentDigestAdjuster(new Map<string, number>([["north", 1.14]])),
    ],
    [],
    3.5,
    7258.3,
  );
}
