import * as numbers from "../../../../kit/numbers.js";
import { ManualFrequencyDraft } from "./manual-frequency-draft.js";

/** One step of the manual frequency draft calculation. */
export interface ManualFrequencyDraftFactor {
  describe(): string;
  adjust(item: ManualFrequencyDraft, value: number): number;
}

export class RoundingManualFrequencyDraftAdjuster implements ManualFrequencyDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualFrequencyDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualFrequencyDraftBudgetOffsetAdjuster implements ManualFrequencyDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualFrequencyDraft, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredManualFrequencyDraftAdjuster implements ManualFrequencyDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFrequencyDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualFrequencyDraftAdjuster implements ManualFrequencyDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualFrequencyDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual frequency draft steps in order and keeps a trace of each. */
export class ManualFrequencyDraftEngine {
  steps: ManualFrequencyDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFrequencyDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualFrequencyDraft): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ManualFrequencyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualFrequencyDraftEngine(): ManualFrequencyDraftEngine {
  return new ManualFrequencyDraftEngine(
    [
      new RoundingManualFrequencyDraftAdjuster(0.1),
      new ManualFrequencyDraftBudgetOffsetAdjuster(1.85),
      new TieredManualFrequencyDraftAdjuster([9925, 9948], [1.15, 0.85]),
      new MinimumManualFrequencyDraftAdjuster(5),
    ],
    [],
    3.1,
    76025,
  );
}
