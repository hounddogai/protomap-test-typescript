import * as numbers from "../../../../kit/numbers.js";
import { CappedReputationDraft } from "./capped-reputation-draft.js";

/** One step of the capped reputation draft calculation. */
export interface CappedReputationDraftFactor {
  describe(): string;
  adjust(item: CappedReputationDraft, value: number): number;
}

export class UtmSourceCappedReputationDraftAdjuster implements CappedReputationDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: CappedReputationDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedReputationDraftAdjuster implements CappedReputationDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedReputationDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedReputationDraftAdjuster implements CappedReputationDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedReputationDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedReputationDraftAdjuster implements CappedReputationDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedReputationDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped reputation draft steps in order and keeps a trace of each. */
export class CappedReputationDraftEngine {
  steps: CappedReputationDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedReputationDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedReputationDraft): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: CappedReputationDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedReputationDraftEngine(): CappedReputationDraftEngine {
  return new CappedReputationDraftEngine(
    [
      new UtmSourceCappedReputationDraftAdjuster(
        new Map<string, number>([["retail", 0.83], ["online", 0.87], ["east", 0.84]]),
      ),
      new CapCappedReputationDraftAdjuster(11509),
      new MinimumCappedReputationDraftAdjuster(26),
      new RoundingCappedReputationDraftAdjuster(0.5),
    ],
    [],
    1.7,
    23294.5,
  );
}
