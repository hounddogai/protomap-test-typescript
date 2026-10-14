import * as numbers from "../../../../kit/numbers.js";
import { EscalationVariance } from "./escalation-variance.js";

/** One step of the escalation variance calculation. */
export interface EscalationVarianceModifier {
  describe(): string;
  adjust(item: EscalationVariance, value: number): number;
}

export class CountryEscalationVarianceAdjuster implements EscalationVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: EscalationVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEscalationVarianceAdjuster implements EscalationVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingEscalationVarianceAdjuster implements EscalationVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the escalation variance steps in order and keeps a trace of each. */
export class EscalationVarianceEngine {
  steps: EscalationVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EscalationVariance): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: EscalationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEscalationVarianceEngine(): EscalationVarianceEngine {
  return new EscalationVarianceEngine(
    [
      new CountryEscalationVarianceAdjuster(
        new Map<string, number>([["south", 1.35], ["online", 1.16], ["west", 1.02]]),
      ),
      new MinimumEscalationVarianceAdjuster(32.4),
      new RoundingEscalationVarianceAdjuster(1),
    ],
    [],
    3.4,
    39255,
  );
}
