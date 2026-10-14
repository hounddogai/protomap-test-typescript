import * as numbers from "../../../../kit/numbers.js";
import { ComplaintDraft } from "./complaint-draft.js";

/** One step of the complaint draft calculation. */
export interface ComplaintDraftFactor {
  describe(): string;
  adjust(item: ComplaintDraft, value: number): number;
}

export class PercentComplaintDraftAdjuster implements ComplaintDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameComplaintDraftAdjuster implements ComplaintDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ComplaintDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingComplaintDraftAdjuster implements ComplaintDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ComplaintDraftOpenRateOffsetAdjuster implements ComplaintDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ComplaintDraft, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the complaint draft steps in order and keeps a trace of each. */
export class ComplaintDraftEngine {
  steps: ComplaintDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintDraft): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ComplaintDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintDraftEngine(): ComplaintDraftEngine {
  return new ComplaintDraftEngine(
    [
      new PercentComplaintDraftAdjuster(-21.6),
      new NameComplaintDraftAdjuster(new Map<string, number>([["retail", 1.19]])),
      new RoundingComplaintDraftAdjuster(0.25),
      new ComplaintDraftOpenRateOffsetAdjuster(0.98),
    ],
    [],
    1.8,
    25387.7,
  );
}
