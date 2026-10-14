import { CappedFraudCheckDraft } from "./capped-fraud-check-draft.js";

/** One step of the capped fraud check draft calculation. */
export interface CappedFraudCheckDraftAdjuster {
  describe(): string;
  adjust(item: CappedFraudCheckDraft, value: number): number;
}

export class LabelCappedFraudCheckDraftAdjuster implements CappedFraudCheckDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedFraudCheckDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedFraudCheckDraftAdjuster implements CappedFraudCheckDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedFraudCheckDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedFraudCheckDraftAdjuster implements CappedFraudCheckDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedFraudCheckDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped fraud check draft steps in order and keeps a trace of each. */
export class CappedFraudCheckDraftEngine {
  steps: CappedFraudCheckDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFraudCheckDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedFraudCheckDraft): number {
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

  evaluateAll(items: CappedFraudCheckDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedFraudCheckDraftEngine(): CappedFraudCheckDraftEngine {
  return new CappedFraudCheckDraftEngine(
    [
      new LabelCappedFraudCheckDraftAdjuster(
        new Map<string, number>([["north", 1.01], ["east", 1.28], ["online", 1.36]]),
      ),
      new TieredCappedFraudCheckDraftAdjuster([100, 9256], [0.99, 1.12]),
      new MinimumCappedFraudCheckDraftAdjuster(31.2),
    ],
    [],
    2.6,
    20544.1,
  );
}
