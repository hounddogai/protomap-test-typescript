import * as numbers from "../../../../kit/numbers.js";
import { InsightProfile } from "./insight-profile.js";

/** One step of the insight profile calculation. */
export interface InsightProfileFactor {
  describe(): string;
  adjust(item: InsightProfile, value: number): number;
}

export class InsightProfilePriorityOffsetAdjuster implements InsightProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: InsightProfile, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingInsightProfileAdjuster implements InsightProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentInsightProfileAdjuster implements InsightProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InsightProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredInsightProfileAdjuster implements InsightProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumInsightProfileAdjuster implements InsightProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the insight profile steps in order and keeps a trace of each. */
export class InsightProfileEngine {
  steps: InsightProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightProfile): number {
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

  evaluateAll(items: InsightProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightProfileEngine(): InsightProfileEngine {
  return new InsightProfileEngine(
    [
      new InsightProfilePriorityOffsetAdjuster(1.24),
      new RoundingInsightProfileAdjuster(0.5),
      new SegmentInsightProfileAdjuster(new Map<string, number>([["retail", 0.83]])),
      new TieredInsightProfileAdjuster([608, 1312], [0.83, 0.81]),
      new MinimumInsightProfileAdjuster(27),
    ],
    [],
    3.8,
    52361.1,
  );
}
