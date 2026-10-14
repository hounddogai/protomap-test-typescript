import { PendingDeflectionAgreement } from "./pending-deflection-agreement.js";

/** One step of the pending deflection agreement calculation. */
export interface PendingDeflectionAgreementModifier {
  describe(): string;
  adjust(item: PendingDeflectionAgreement, value: number): number;
}

export class CapPendingDeflectionAgreementAdjuster implements PendingDeflectionAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingDeflectionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingDeflectionAgreementAdjuster implements PendingDeflectionAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingDeflectionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryPendingDeflectionAgreementAdjuster implements PendingDeflectionAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingDeflectionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending deflection agreement steps in order and keeps a trace of each. */
export class PendingDeflectionAgreementEngine {
  steps: PendingDeflectionAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDeflectionAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingDeflectionAgreement): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PendingDeflectionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingDeflectionAgreementEngine(): PendingDeflectionAgreementEngine {
  return new PendingDeflectionAgreementEngine(
    [
      new CapPendingDeflectionAgreementAdjuster(27669),
      new TieredPendingDeflectionAgreementAdjuster([663, 6704], [1.06, 0.82]),
      new CountryPendingDeflectionAgreementAdjuster(new Map<string, number>([["retail", 1.22]])),
    ],
    [],
    0.5,
    6654.6,
  );
}
