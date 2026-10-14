import * as numbers from "../../../../kit/numbers.js";
import { LegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

/** One step of the legacy fraud check estimate calculation. */
export interface LegacyFraudCheckEstimateModifier {
  describe(): string;
  adjust(item: LegacyFraudCheckEstimate, value: number): number;
}

export class CountryLegacyFraudCheckEstimateAdjuster implements LegacyFraudCheckEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyFraudCheckEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyFraudCheckEstimateAdjuster implements LegacyFraudCheckEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyFraudCheckEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyFraudCheckEstimateAdjuster implements LegacyFraudCheckEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFraudCheckEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy fraud check estimate steps in order and keeps a trace of each. */
export class LegacyFraudCheckEstimateEngine {
  steps: LegacyFraudCheckEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFraudCheckEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyFraudCheckEstimate): number {
    let current = item.netVolume();
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

  evaluateAll(items: LegacyFraudCheckEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyFraudCheckEstimateEngine(): LegacyFraudCheckEstimateEngine {
  return new LegacyFraudCheckEstimateEngine(
    [
      new CountryLegacyFraudCheckEstimateAdjuster(
        new Map<string, number>([["south", 1.06], ["central", 1.26], ["north", 1.06]]),
      ),
      new MinimumLegacyFraudCheckEstimateAdjuster(33.8),
      new RoundingLegacyFraudCheckEstimateAdjuster(0.1),
    ],
    [],
    2,
    94982,
  );
}
