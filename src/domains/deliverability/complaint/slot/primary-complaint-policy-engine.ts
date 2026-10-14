import * as numbers from "../../../../kit/numbers.js";
import { PrimaryComplaintPolicy } from "./primary-complaint-policy.js";

/** One step of the primary complaint policy calculation. */
export interface PrimaryComplaintPolicyModifier {
  describe(): string;
  adjust(item: PrimaryComplaintPolicy, value: number): number;
}

export class RoundingPrimaryComplaintPolicyAdjuster implements PrimaryComplaintPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryComplaintPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryComplaintPolicyAdjuster implements PrimaryComplaintPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryComplaintPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimaryComplaintPolicyAdjuster implements PrimaryComplaintPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryComplaintPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary complaint policy steps in order and keeps a trace of each. */
export class PrimaryComplaintPolicyEngine {
  steps: PrimaryComplaintPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryComplaintPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryComplaintPolicy): number {
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

  evaluateAll(items: PrimaryComplaintPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryComplaintPolicyEngine(): PrimaryComplaintPolicyEngine {
  return new PrimaryComplaintPolicyEngine(
    [
      new RoundingPrimaryComplaintPolicyAdjuster(0.25),
      new MinimumPrimaryComplaintPolicyAdjuster(0.8),
      new TieredPrimaryComplaintPolicyAdjuster([3950, 4946], [1.01, 1.09]),
    ],
    [],
    2.7,
    95212.4,
  );
}
