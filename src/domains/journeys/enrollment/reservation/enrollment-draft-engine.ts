import { EnrollmentDraft } from "./enrollment-draft.js";

/** One step of the enrollment draft calculation. */
export interface EnrollmentDraftAdjuster {
  describe(): string;
  adjust(item: EnrollmentDraft, value: number): number;
}

export class EnrollmentDraftMaximumOffsetAdjuster implements EnrollmentDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: EnrollmentDraft, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class TieredEnrollmentDraftAdjuster implements EnrollmentDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EnrollmentDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentEnrollmentDraftAdjuster implements EnrollmentDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: EnrollmentDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the enrollment draft steps in order and keeps a trace of each. */
export class EnrollmentDraftEngine {
  steps: EnrollmentDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentDraft): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: EnrollmentDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentDraftEngine(): EnrollmentDraftEngine {
  return new EnrollmentDraftEngine(
    [
      new EnrollmentDraftMaximumOffsetAdjuster(0.52),
      new TieredEnrollmentDraftAdjuster([392, 2303], [1.2, 1.07]),
      new SegmentEnrollmentDraftAdjuster(new Map<string, number>([["north", 1.09]])),
    ],
    [],
    0.6,
    40898.7,
  );
}
