import * as numbers from "../../../../kit/numbers.js";
import { InsightCycle } from "./insight-cycle.js";

/** One step of the insight cycle calculation. */
export interface InsightCycleModifier {
  describe(): string;
  adjust(item: InsightCycle, value: number): number;
}

export class RoundingInsightCycleAdjuster implements InsightCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class InsightCycleRatioOffsetAdjuster implements InsightCycleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: InsightCycle, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredInsightCycleAdjuster implements InsightCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumInsightCycleAdjuster implements InsightCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelInsightCycleAdjuster implements InsightCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: InsightCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight cycle steps in order and keeps a trace of each. */
export class InsightCycleEngine {
  steps: InsightCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightCycle): number {
    let current = item.netVolume();
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

  evaluateAll(items: InsightCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightCycleEngine(): InsightCycleEngine {
  return new InsightCycleEngine(
    [
      new RoundingInsightCycleAdjuster(5),
      new InsightCycleRatioOffsetAdjuster(1.15),
      new TieredInsightCycleAdjuster([967, 9458], [0.8, 0.87]),
      new MinimumInsightCycleAdjuster(48.6),
      new LabelInsightCycleAdjuster(
        new Map<string, number>([["retail", 1.21], ["west", 1.32], ["central", 1.27]]),
      ),
    ],
    [],
    0.4,
    24761.4,
  );
}
