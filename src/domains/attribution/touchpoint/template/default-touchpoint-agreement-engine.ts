import * as numbers from "../../../../kit/numbers.js";
import { DefaultTouchpointAgreement } from "./default-touchpoint-agreement.js";

/** One step of the default touchpoint agreement calculation. */
export interface DefaultTouchpointAgreementFactor {
  describe(): string;
  adjust(item: DefaultTouchpointAgreement, value: number): number;
}

export class PercentDefaultTouchpointAgreementAdjuster implements DefaultTouchpointAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultTouchpointAgreementAdjuster implements DefaultTouchpointAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultTouchpointAgreementAdjuster implements DefaultTouchpointAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDefaultTouchpointAgreementAdjuster implements DefaultTouchpointAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DefaultTouchpointAgreementCapacityOffsetAdjuster implements DefaultTouchpointAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapDefaultTouchpointAgreementAdjuster implements DefaultTouchpointAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultTouchpointAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default touchpoint agreement steps in order and keeps a trace of each. */
export class DefaultTouchpointAgreementEngine {
  steps: DefaultTouchpointAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultTouchpointAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultTouchpointAgreement): number {
    let current = item.projectedValue();
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

  evaluateAll(items: DefaultTouchpointAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultTouchpointAgreementEngine(): DefaultTouchpointAgreementEngine {
  return new DefaultTouchpointAgreementEngine(
    [
      new PercentDefaultTouchpointAgreementAdjuster(-18.8),
      new MinimumDefaultTouchpointAgreementAdjuster(18.6),
      new TieredDefaultTouchpointAgreementAdjuster([1998, 3383, 7639, 8542], [1.14, 0.92, 1.18, 0.89]),
      new RoundingDefaultTouchpointAgreementAdjuster(0.1),
      new DefaultTouchpointAgreementCapacityOffsetAdjuster(1.75),
      new CapDefaultTouchpointAgreementAdjuster(45403),
    ],
    [],
    0.9,
    67883.3,
  );
}
