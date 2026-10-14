import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTouchpointAgreement } from "./primary-touchpoint-agreement.js";

/** One step of the primary touchpoint agreement calculation. */
export interface PrimaryTouchpointAgreementFactor {
  describe(): string;
  adjust(item: PrimaryTouchpointAgreement, value: number): number;
}

export class TieredPrimaryTouchpointAgreementAdjuster implements PrimaryTouchpointAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryTouchpointAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimaryTouchpointAgreementAdjuster implements PrimaryTouchpointAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryTouchpointAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PrimaryTouchpointAgreementQuantityOffsetAdjuster implements PrimaryTouchpointAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PrimaryTouchpointAgreement, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the primary touchpoint agreement steps in order and keeps a trace of each. */
export class PrimaryTouchpointAgreementEngine {
  steps: PrimaryTouchpointAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTouchpointAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryTouchpointAgreement): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PrimaryTouchpointAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryTouchpointAgreementEngine(): PrimaryTouchpointAgreementEngine {
  return new PrimaryTouchpointAgreementEngine(
    [
      new TieredPrimaryTouchpointAgreementAdjuster([61, 4021, 8301], [0.89, 0.94, 0.9]),
      new CapPrimaryTouchpointAgreementAdjuster(46865),
      new PrimaryTouchpointAgreementQuantityOffsetAdjuster(0.64),
    ],
    [],
    3.1,
    30716.6,
  );
}
