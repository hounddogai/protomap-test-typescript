import * as numbers from "../../../../kit/numbers.js";
import { RollingReputationRequest } from "./rolling-reputation-request.js";

/** One step of the rolling reputation request calculation. */
export interface RollingReputationRequestStep {
  describe(): string;
  adjust(item: RollingReputationRequest, value: number): number;
}

export class MinimumRollingReputationRequestAdjuster implements RollingReputationRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingReputationRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingReputationRequestAdjuster implements RollingReputationRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingReputationRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryRollingReputationRequestAdjuster implements RollingReputationRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RollingReputationRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingReputationRequestDiscountOffsetAdjuster implements RollingReputationRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RollingReputationRequest, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the rolling reputation request steps in order and keeps a trace of each. */
export class RollingReputationRequestEngine {
  steps: RollingReputationRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingReputationRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingReputationRequest): number {
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

  evaluateAll(items: RollingReputationRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingReputationRequestEngine(): RollingReputationRequestEngine {
  return new RollingReputationRequestEngine(
    [
      new MinimumRollingReputationRequestAdjuster(33.9),
      new PercentRollingReputationRequestAdjuster(24),
      new CountryRollingReputationRequestAdjuster(new Map<string, number>([["online", 0.82], ["retail", 0.8]])),
      new RollingReputationRequestDiscountOffsetAdjuster(0.52),
    ],
    [],
    0.7,
    43176.9,
  );
}
