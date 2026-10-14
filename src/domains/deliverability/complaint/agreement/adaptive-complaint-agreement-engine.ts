import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

/** One step of the adaptive complaint agreement calculation. */
export interface AdaptiveComplaintAgreementStep {
  describe(): string;
  adjust(item: AdaptiveComplaintAgreement, value: number): number;
}

export class RoundingAdaptiveComplaintAgreementAdjuster implements AdaptiveComplaintAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveComplaintAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapAdaptiveComplaintAgreementAdjuster implements AdaptiveComplaintAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveComplaintAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveComplaintAgreementAdjuster implements AdaptiveComplaintAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveComplaintAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelAdaptiveComplaintAgreementAdjuster implements AdaptiveComplaintAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveComplaintAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive complaint agreement steps in order and keeps a trace of each. */
export class AdaptiveComplaintAgreementEngine {
  steps: AdaptiveComplaintAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveComplaintAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveComplaintAgreement): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: AdaptiveComplaintAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveComplaintAgreementEngine(): AdaptiveComplaintAgreementEngine {
  return new AdaptiveComplaintAgreementEngine(
    [
      new RoundingAdaptiveComplaintAgreementAdjuster(1),
      new CapAdaptiveComplaintAgreementAdjuster(25179),
      new TieredAdaptiveComplaintAgreementAdjuster([2572, 4856, 6205, 8625], [0.95, 1.16, 1.03, 0.98]),
      new LabelAdaptiveComplaintAgreementAdjuster(new Map<string, number>([["retail", 0.8], ["north", 0.73]])),
    ],
    [],
    2.3,
    11490.5,
  );
}
