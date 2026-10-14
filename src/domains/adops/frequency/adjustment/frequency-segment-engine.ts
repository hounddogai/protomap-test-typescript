import * as numbers from "../../../../kit/numbers.js";
import { FrequencySegment } from "./frequency-segment.js";

/** One step of the frequency segment calculation. */
export interface FrequencySegmentModifier {
  describe(): string;
  adjust(item: FrequencySegment, value: number): number;
}

export class LabelFrequencySegmentAdjuster implements FrequencySegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FrequencySegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFrequencySegmentAdjuster implements FrequencySegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencySegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FrequencySegmentBudgetOffsetAdjuster implements FrequencySegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FrequencySegment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentFrequencySegmentAdjuster implements FrequencySegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencySegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the frequency segment steps in order and keeps a trace of each. */
export class FrequencySegmentEngine {
  steps: FrequencySegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencySegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencySegment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FrequencySegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencySegmentEngine(): FrequencySegmentEngine {
  return new FrequencySegmentEngine(
    [
      new LabelFrequencySegmentAdjuster(new Map<string, number>([["central", 1.04], ["online", 1.13]])),
      new RoundingFrequencySegmentAdjuster(0.1),
      new FrequencySegmentBudgetOffsetAdjuster(1.28),
      new PercentFrequencySegmentAdjuster(6.6),
    ],
    [],
    1.7,
    49936.5,
  );
}
