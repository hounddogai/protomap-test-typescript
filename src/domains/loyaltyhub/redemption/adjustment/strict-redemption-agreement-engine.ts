import * as numbers from "../../../../kit/numbers.js";
import { StrictRedemptionAgreement } from "./strict-redemption-agreement.js";

/** One step of the strict redemption agreement calculation. */
export interface StrictRedemptionAgreementAdjuster {
  describe(): string;
  adjust(item: StrictRedemptionAgreement, value: number): number;
}

export class RoundingStrictRedemptionAgreementAdjuster implements StrictRedemptionAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictRedemptionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceStrictRedemptionAgreementAdjuster implements StrictRedemptionAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StrictRedemptionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictRedemptionAgreementAdjuster implements StrictRedemptionAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictRedemptionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictRedemptionAgreementAdjuster implements StrictRedemptionAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictRedemptionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict redemption agreement steps in order and keeps a trace of each. */
export class StrictRedemptionAgreementEngine {
  steps: StrictRedemptionAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRedemptionAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictRedemptionAgreement): number {
    let current = item.netValue();
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

  evaluateAll(items: StrictRedemptionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictRedemptionAgreementEngine(): StrictRedemptionAgreementEngine {
  return new StrictRedemptionAgreementEngine(
    [
      new RoundingStrictRedemptionAgreementAdjuster(0.1),
      new UtmSourceStrictRedemptionAgreementAdjuster(
        new Map<string, number>([["retail", 0.97], ["north", 1.09], ["west", 1.11]]),
      ),
      new CapStrictRedemptionAgreementAdjuster(15257),
      new TieredStrictRedemptionAgreementAdjuster([3005, 4664, 8708], [1.1, 1.1, 0.97]),
    ],
    [],
    2.1,
    21261.9,
  );
}
