import * as numbers from "../../../../kit/numbers.js";
import { InsightAssignment } from "./insight-assignment.js";

/** One step of the insight assignment calculation. */
export interface InsightAssignmentFactor {
  describe(): string;
  adjust(item: InsightAssignment, value: number): number;
}

export class MinimumInsightAssignmentAdjuster implements InsightAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredInsightAssignmentAdjuster implements InsightAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelInsightAssignmentAdjuster implements InsightAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: InsightAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight assignment steps in order and keeps a trace of each. */
export class InsightAssignmentEngine {
  steps: InsightAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightAssignment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: InsightAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightAssignmentEngine(): InsightAssignmentEngine {
  return new InsightAssignmentEngine(
    [
      new MinimumInsightAssignmentAdjuster(13.7),
      new TieredInsightAssignmentAdjuster([5993, 6046, 7438, 7979], [0.86, 0.86, 0.83, 1.15]),
      new ChannelInsightAssignmentAdjuster(new Map<string, number>([["south", 0.79]])),
    ],
    [],
    1.7,
    56902.9,
  );
}
