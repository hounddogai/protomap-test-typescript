import * as numbers from "../../../../kit/numbers.js";
import { ChallengeDraft } from "./challenge-draft.js";

/** One step of the challenge draft calculation. */
export interface ChallengeDraftStep {
  describe(): string;
  adjust(item: ChallengeDraft, value: number): number;
}

export class UnitChallengeDraftAdjuster implements ChallengeDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ChallengeDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapChallengeDraftAdjuster implements ChallengeDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChallengeDraftBidOffsetAdjuster implements ChallengeDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ChallengeDraft, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the challenge draft steps in order and keeps a trace of each. */
export class ChallengeDraftEngine {
  steps: ChallengeDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeDraft): number {
    let current = item.netValue();
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

  evaluateAll(items: ChallengeDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeDraftEngine(): ChallengeDraftEngine {
  return new ChallengeDraftEngine(
    [
      new UnitChallengeDraftAdjuster(new Map<string, number>([["retail", 0.83], ["online", 1.24]])),
      new CapChallengeDraftAdjuster(29022),
      new ChallengeDraftBidOffsetAdjuster(1.99),
    ],
    [],
    4.6,
    59050.9,
  );
}
