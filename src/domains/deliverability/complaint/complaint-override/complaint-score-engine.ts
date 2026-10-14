import * as numbers from "../../../../kit/numbers.js";
import { ComplaintScore } from "./complaint-score.js";

/** One step of the complaint score calculation. */
export interface ComplaintScoreStep {
  describe(): string;
  adjust(item: ComplaintScore, value: number): number;
}

export class CategoryComplaintScoreAdjuster implements ComplaintScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ComplaintScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingComplaintScoreAdjuster implements ComplaintScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ComplaintScoreSendAtOffsetAdjuster implements ComplaintScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ComplaintScore, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the complaint score steps in order and keeps a trace of each. */
export class ComplaintScoreEngine {
  steps: ComplaintScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ComplaintScore): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ComplaintScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultComplaintScoreEngine(): ComplaintScoreEngine {
  return new ComplaintScoreEngine(
    [
      new CategoryComplaintScoreAdjuster(new Map<string, number>([["west", 0.8], ["online", 0.81]])),
      new RoundingComplaintScoreAdjuster(0.25),
      new ComplaintScoreSendAtOffsetAdjuster(1.54),
    ],
    [],
    4.7,
    41223.8,
  );
}
