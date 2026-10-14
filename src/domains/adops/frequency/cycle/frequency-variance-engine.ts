import { FrequencyVariance } from "./frequency-variance.js";

/** One step of the frequency variance calculation. */
export interface FrequencyVarianceModifier {
  describe(): string;
  adjust(item: FrequencyVariance, value: number): number;
}

export class FrequencyVarianceBudgetOffsetAdjuster implements FrequencyVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FrequencyVariance, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentFrequencyVarianceAdjuster implements FrequencyVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceFrequencyVarianceAdjuster implements FrequencyVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FrequencyVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the frequency variance steps in order and keeps a trace of each. */
export class FrequencyVarianceEngine {
  steps: FrequencyVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyVariance): number {
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

  evaluateAll(items: FrequencyVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyVarianceEngine(): FrequencyVarianceEngine {
  return new FrequencyVarianceEngine(
    [
      new FrequencyVarianceBudgetOffsetAdjuster(0.12),
      new PercentFrequencyVarianceAdjuster(23.1),
      new SourceFrequencyVarianceAdjuster(new Map<string, number>([["west", 1.14], ["retail", 1.2]])),
    ],
    [],
    1.1,
    20680.9,
  );
}
