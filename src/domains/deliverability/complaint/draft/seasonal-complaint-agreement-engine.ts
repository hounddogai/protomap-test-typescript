import * as numbers from "../../../../kit/numbers.js";
import { SeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

/** One step of the seasonal complaint agreement calculation. */
export interface SeasonalComplaintAgreementAdjuster {
  describe(): string;
  adjust(item: SeasonalComplaintAgreement, value: number): number;
}

export class CategorySeasonalComplaintAgreementAdjuster implements SeasonalComplaintAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: SeasonalComplaintAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalComplaintAgreementAdjuster implements SeasonalComplaintAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalComplaintAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalComplaintAgreementAdjuster implements SeasonalComplaintAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalComplaintAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal complaint agreement steps in order and keeps a trace of each. */
export class SeasonalComplaintAgreementEngine {
  steps: SeasonalComplaintAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalComplaintAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalComplaintAgreement): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: SeasonalComplaintAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalComplaintAgreementEngine(): SeasonalComplaintAgreementEngine {
  return new SeasonalComplaintAgreementEngine(
    [
      new CategorySeasonalComplaintAgreementAdjuster(
        new Map<string, number>([["central", 1.39], ["online", 1.26]]),
      ),
      new TieredSeasonalComplaintAgreementAdjuster([3700, 9741], [0.85, 0.96]),
      new CapSeasonalComplaintAgreementAdjuster(21184),
    ],
    [],
    1.7,
    45999.5,
  );
}
