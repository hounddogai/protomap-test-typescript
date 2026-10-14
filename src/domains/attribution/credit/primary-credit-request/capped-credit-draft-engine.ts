import * as numbers from "../../../../kit/numbers.js";
import { CappedCreditDraft } from "./capped-credit-draft.js";

/** One step of the capped credit draft calculation. */
export interface CappedCreditDraftModifier {
  describe(): string;
  adjust(item: CappedCreditDraft, value: number): number;
}

export class CappedCreditDraftGraceDaysOffsetAdjuster implements CappedCreditDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: CappedCreditDraft, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumCappedCreditDraftAdjuster implements CappedCreditDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedCreditDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCappedCreditDraftAdjuster implements CappedCreditDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedCreditDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedCreditDraftAdjuster implements CappedCreditDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedCreditDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedCreditDraftAdjuster implements CappedCreditDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCreditDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped credit draft steps in order and keeps a trace of each. */
export class CappedCreditDraftEngine {
  steps: CappedCreditDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCreditDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedCreditDraft): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CappedCreditDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedCreditDraftEngine(): CappedCreditDraftEngine {
  return new CappedCreditDraftEngine(
    [
      new CappedCreditDraftGraceDaysOffsetAdjuster(0.16),
      new MinimumCappedCreditDraftAdjuster(30.2),
      new PercentCappedCreditDraftAdjuster(2),
      new CapCappedCreditDraftAdjuster(5021),
      new RoundingCappedCreditDraftAdjuster(0.05),
    ],
    [],
    1.3,
    97047.5,
  );
}
