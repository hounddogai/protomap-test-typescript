import * as numbers from "../../../../kit/numbers.js";
import { OptOutAgreement } from "./opt-out-agreement.js";

/** One step of the opt out agreement calculation. */
export interface OptOutAgreementFactor {
  describe(): string;
  adjust(item: OptOutAgreement, value: number): number;
}

export class TieredOptOutAgreementAdjuster implements OptOutAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceOptOutAgreementAdjuster implements OptOutAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: OptOutAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingOptOutAgreementAdjuster implements OptOutAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapOptOutAgreementAdjuster implements OptOutAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the opt out agreement steps in order and keeps a trace of each. */
export class OptOutAgreementEngine {
  steps: OptOutAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutAgreement): number {
    let current = item.netExposure();
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

  evaluateAll(items: OptOutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutAgreementEngine(): OptOutAgreementEngine {
  return new OptOutAgreementEngine(
    [
      new TieredOptOutAgreementAdjuster([2434, 6322], [1.07, 0.91]),
      new SourceOptOutAgreementAdjuster(new Map<string, number>([["west", 1.22], ["central", 1.11]])),
      new RoundingOptOutAgreementAdjuster(0.1),
      new CapOptOutAgreementAdjuster(8440),
    ],
    [],
    0.4,
    93344.8,
  );
}
