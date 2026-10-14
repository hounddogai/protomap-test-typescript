import * as numbers from "../../../../kit/numbers.js";
import { InsightManifest } from "./insight-manifest.js";

/** One step of the insight manifest calculation. */
export interface InsightManifestStep {
  describe(): string;
  adjust(item: InsightManifest, value: number): number;
}

export class InsightManifestCapacityOffsetAdjuster implements InsightManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: InsightManifest, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class RoundingInsightManifestAdjuster implements InsightManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredInsightManifestAdjuster implements InsightManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumInsightManifestAdjuster implements InsightManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentInsightManifestAdjuster implements InsightManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight manifest steps in order and keeps a trace of each. */
export class InsightManifestEngine {
  steps: InsightManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightManifest): number {
    let current = item.projectedValue();
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

  evaluateAll(items: InsightManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightManifestEngine(): InsightManifestEngine {
  return new InsightManifestEngine(
    [
      new InsightManifestCapacityOffsetAdjuster(0.31),
      new RoundingInsightManifestAdjuster(5),
      new TieredInsightManifestAdjuster([1740, 5787, 9082, 9619], [1.18, 0.83, 1.04, 1.04]),
      new MinimumInsightManifestAdjuster(27.6),
      new PercentInsightManifestAdjuster(20.3),
    ],
    [],
    2.4,
    29477.8,
  );
}
