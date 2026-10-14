import * as numbers from "../../../../kit/numbers.js";
import { DefaultPacingAgreement } from "./default-pacing-agreement.js";

/** One step of the default pacing agreement calculation. */
export interface DefaultPacingAgreementModifier {
  describe(): string;
  adjust(item: DefaultPacingAgreement, value: number): number;
}

export class CapDefaultPacingAgreementAdjuster implements DefaultPacingAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPacingAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultPacingAgreementAdjuster implements DefaultPacingAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPacingAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceDefaultPacingAgreementAdjuster implements DefaultPacingAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: DefaultPacingAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default pacing agreement steps in order and keeps a trace of each. */
export class DefaultPacingAgreementEngine {
  steps: DefaultPacingAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPacingAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultPacingAgreement): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DefaultPacingAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultPacingAgreementEngine(): DefaultPacingAgreementEngine {
  return new DefaultPacingAgreementEngine(
    [
      new CapDefaultPacingAgreementAdjuster(4066),
      new TieredDefaultPacingAgreementAdjuster([1106, 6483], [1.07, 1.17]),
      new SourceDefaultPacingAgreementAdjuster(new Map<string, number>([["online", 0.94]])),
    ],
    [],
    4.5,
    22630.3,
  );
}
