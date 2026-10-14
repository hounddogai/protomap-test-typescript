import { ReputationDraft } from "./reputation-draft.js";

/** One step of the reputation draft calculation. */
export interface ReputationDraftModifier {
  describe(): string;
  adjust(item: ReputationDraft, value: number): number;
}

export class ReputationDraftDurationMinutesOffsetAdjuster implements ReputationDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ReputationDraft, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapReputationDraftAdjuster implements ReputationDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumReputationDraftAdjuster implements ReputationDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation draft steps in order and keeps a trace of each. */
export class ReputationDraftEngine {
  steps: ReputationDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReputationDraft): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ReputationDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReputationDraftEngine(): ReputationDraftEngine {
  return new ReputationDraftEngine(
    [
      new ReputationDraftDurationMinutesOffsetAdjuster(0.12),
      new CapReputationDraftAdjuster(15512),
      new MinimumReputationDraftAdjuster(12.3),
    ],
    [],
    2.8,
    64983,
  );
}
