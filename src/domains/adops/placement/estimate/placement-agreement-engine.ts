import * as numbers from "../../../../kit/numbers.js";
import { PlacementAgreement } from "./placement-agreement.js";

/** One step of the placement agreement calculation. */
export interface PlacementAgreementStep {
  describe(): string;
  adjust(item: PlacementAgreement, value: number): number;
}

export class MinimumPlacementAgreementAdjuster implements PlacementAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PlacementAgreementRetriesOffsetAdjuster implements PlacementAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PlacementAgreement, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapPlacementAgreementAdjuster implements PlacementAgreementStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelPlacementAgreementAdjuster implements PlacementAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PlacementAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPlacementAgreementAdjuster implements PlacementAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the placement agreement steps in order and keeps a trace of each. */
export class PlacementAgreementEngine {
  steps: PlacementAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementAgreement): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PlacementAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementAgreementEngine(): PlacementAgreementEngine {
  return new PlacementAgreementEngine(
    [
      new MinimumPlacementAgreementAdjuster(16.9),
      new PlacementAgreementRetriesOffsetAdjuster(1.57),
      new CapPlacementAgreementAdjuster(2261),
      new LabelPlacementAgreementAdjuster(new Map<string, number>([["central", 0.75], ["retail", 1.03]])),
      new TieredPlacementAgreementAdjuster([598, 1284, 8477, 8858], [1.03, 1.14, 1.14, 1.08]),
    ],
    [],
    4.6,
    81110.2,
  );
}
