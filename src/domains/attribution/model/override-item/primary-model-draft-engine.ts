import * as numbers from "../../../../kit/numbers.js";
import { PrimaryModelDraft } from "./primary-model-draft.js";

/** One step of the primary model draft calculation. */
export interface PrimaryModelDraftAdjuster {
  describe(): string;
  adjust(item: PrimaryModelDraft, value: number): number;
}

export class RoundingPrimaryModelDraftAdjuster implements PrimaryModelDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryModelDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryModelDraftAdjuster implements PrimaryModelDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryModelDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimaryModelDraftBudgetOffsetAdjuster implements PrimaryModelDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PrimaryModelDraft, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumPrimaryModelDraftAdjuster implements PrimaryModelDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryModelDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary model draft steps in order and keeps a trace of each. */
export class PrimaryModelDraftEngine {
  steps: PrimaryModelDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryModelDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryModelDraft): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PrimaryModelDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryModelDraftEngine(): PrimaryModelDraftEngine {
  return new PrimaryModelDraftEngine(
    [
      new RoundingPrimaryModelDraftAdjuster(0.25),
      new CapPrimaryModelDraftAdjuster(46031),
      new PrimaryModelDraftBudgetOffsetAdjuster(1.54),
      new MinimumPrimaryModelDraftAdjuster(25.8),
    ],
    [],
    1.5,
    83700.4,
  );
}
