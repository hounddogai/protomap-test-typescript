import * as numbers from "../../../../kit/numbers.js";
import { DefaultEnrollmentDraft } from "./default-enrollment-draft.js";

/** One step of the default enrollment draft calculation. */
export interface DefaultEnrollmentDraftStep {
  describe(): string;
  adjust(item: DefaultEnrollmentDraft, value: number): number;
}

export class MinimumDefaultEnrollmentDraftAdjuster implements DefaultEnrollmentDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultEnrollmentDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelDefaultEnrollmentDraftAdjuster implements DefaultEnrollmentDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultEnrollmentDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultEnrollmentDraftAdjuster implements DefaultEnrollmentDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultEnrollmentDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultEnrollmentDraftAdjuster implements DefaultEnrollmentDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultEnrollmentDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class DefaultEnrollmentDraftDurationMinutesOffsetAdjuster implements DefaultEnrollmentDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: DefaultEnrollmentDraft, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the default enrollment draft steps in order and keeps a trace of each. */
export class DefaultEnrollmentDraftEngine {
  steps: DefaultEnrollmentDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultEnrollmentDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultEnrollmentDraft): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultEnrollmentDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultEnrollmentDraftEngine(): DefaultEnrollmentDraftEngine {
  return new DefaultEnrollmentDraftEngine(
    [
      new MinimumDefaultEnrollmentDraftAdjuster(15.6),
      new LabelDefaultEnrollmentDraftAdjuster(new Map<string, number>([["east", 0.79]])),
      new RoundingDefaultEnrollmentDraftAdjuster(0.1),
      new TieredDefaultEnrollmentDraftAdjuster([4610, 6638], [1.06, 1.03]),
      new DefaultEnrollmentDraftDurationMinutesOffsetAdjuster(1.41),
    ],
    [],
    0.1,
    93966,
  );
}
