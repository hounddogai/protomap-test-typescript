import * as numbers from "../../../../kit/numbers.js";
import { PrimarySenderAgreement } from "./primary-sender-agreement.js";

/** One step of the primary sender agreement calculation. */
export interface PrimarySenderAgreementModifier {
  describe(): string;
  adjust(item: PrimarySenderAgreement, value: number): number;
}

export class MinimumPrimarySenderAgreementAdjuster implements PrimarySenderAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySenderAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimarySenderAgreementAdjuster implements PrimarySenderAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySenderAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePrimarySenderAgreementAdjuster implements PrimarySenderAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimarySenderAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPrimarySenderAgreementAdjuster implements PrimarySenderAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySenderAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PrimarySenderAgreementPriorityOffsetAdjuster implements PrimarySenderAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PrimarySenderAgreement, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the primary sender agreement steps in order and keeps a trace of each. */
export class PrimarySenderAgreementEngine {
  steps: PrimarySenderAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySenderAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimarySenderAgreement): number {
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

  evaluateAll(items: PrimarySenderAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimarySenderAgreementEngine(): PrimarySenderAgreementEngine {
  return new PrimarySenderAgreementEngine(
    [
      new MinimumPrimarySenderAgreementAdjuster(18.1),
      new TieredPrimarySenderAgreementAdjuster([2356, 2719, 7326, 9172], [1.04, 0.86, 0.97, 0.98]),
      new NamePrimarySenderAgreementAdjuster(new Map<string, number>([["north", 0.89]])),
      new RoundingPrimarySenderAgreementAdjuster(0.1),
      new PrimarySenderAgreementPriorityOffsetAdjuster(1.16),
    ],
    [],
    0.7,
    11416.3,
  );
}
