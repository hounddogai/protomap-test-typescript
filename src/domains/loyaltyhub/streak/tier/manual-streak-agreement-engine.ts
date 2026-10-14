import * as numbers from "../../../../kit/numbers.js";
import { ManualStreakAgreement } from "./manual-streak-agreement.js";

/** One step of the manual streak agreement calculation. */
export interface ManualStreakAgreementFactor {
  describe(): string;
  adjust(item: ManualStreakAgreement, value: number): number;
}

export class ManualStreakAgreementRetriesOffsetAdjuster implements ManualStreakAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingManualStreakAgreementAdjuster implements ManualStreakAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualStreakAgreementAdjuster implements ManualStreakAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleManualStreakAgreementAdjuster implements ManualStreakAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualStreakAgreementAdjuster implements ManualStreakAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualStreakAgreementAdjuster implements ManualStreakAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualStreakAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual streak agreement steps in order and keeps a trace of each. */
export class ManualStreakAgreementEngine {
  steps: ManualStreakAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualStreakAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualStreakAgreement): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ManualStreakAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualStreakAgreementEngine(): ManualStreakAgreementEngine {
  return new ManualStreakAgreementEngine(
    [
      new ManualStreakAgreementRetriesOffsetAdjuster(0.35),
      new RoundingManualStreakAgreementAdjuster(0.05),
      new CapManualStreakAgreementAdjuster(21241),
      new TitleManualStreakAgreementAdjuster(new Map<string, number>([["central", 1.23]])),
      new MinimumManualStreakAgreementAdjuster(18.8),
      new TieredManualStreakAgreementAdjuster([4144, 5329, 7912, 8155], [0.99, 0.95, 1.07, 1.2]),
    ],
    [],
    2,
    28166.3,
  );
}
