import * as numbers from "../../../../kit/numbers.js";
import { PrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

/** One step of the primary exit rule agreement calculation. */
export interface PrimaryExitRuleAgreementAdjuster {
  describe(): string;
  adjust(item: PrimaryExitRuleAgreement, value: number): number;
}

export class PrimaryExitRuleAgreementImpressionsOffsetAdjuster implements PrimaryExitRuleAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PrimaryExitRuleAgreement, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredPrimaryExitRuleAgreementAdjuster implements PrimaryExitRuleAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryExitRuleAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentPrimaryExitRuleAgreementAdjuster implements PrimaryExitRuleAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PrimaryExitRuleAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryExitRuleAgreementAdjuster implements PrimaryExitRuleAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryExitRuleAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary exit rule agreement steps in order and keeps a trace of each. */
export class PrimaryExitRuleAgreementEngine {
  steps: PrimaryExitRuleAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryExitRuleAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryExitRuleAgreement): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimaryExitRuleAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryExitRuleAgreementEngine(): PrimaryExitRuleAgreementEngine {
  return new PrimaryExitRuleAgreementEngine(
    [
      new PrimaryExitRuleAgreementImpressionsOffsetAdjuster(0.39),
      new TieredPrimaryExitRuleAgreementAdjuster([1668, 5056, 9641], [0.87, 1.16, 1.08]),
      new SegmentPrimaryExitRuleAgreementAdjuster(new Map<string, number>([["north", 0.99]])),
      new MinimumPrimaryExitRuleAgreementAdjuster(25.4),
    ],
    [],
    0.8,
    51088.9,
  );
}
