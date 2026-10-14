import * as numbers from "../../../../kit/numbers.js";
import { RollingPaywallAgreement } from "./rolling-paywall-agreement.js";

/** One step of the rolling paywall agreement calculation. */
export interface RollingPaywallAgreementModifier {
  describe(): string;
  adjust(item: RollingPaywallAgreement, value: number): number;
}

export class RollingPaywallAgreementCapacityOffsetAdjuster implements RollingPaywallAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: RollingPaywallAgreement, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapRollingPaywallAgreementAdjuster implements RollingPaywallAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPaywallAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingPaywallAgreementAdjuster implements RollingPaywallAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPaywallAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingPaywallAgreementAdjuster implements RollingPaywallAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPaywallAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingPaywallAgreementAdjuster implements RollingPaywallAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingPaywallAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling paywall agreement steps in order and keeps a trace of each. */
export class RollingPaywallAgreementEngine {
  steps: RollingPaywallAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPaywallAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingPaywallAgreement): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingPaywallAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingPaywallAgreementEngine(): RollingPaywallAgreementEngine {
  return new RollingPaywallAgreementEngine(
    [
      new RollingPaywallAgreementCapacityOffsetAdjuster(0.52),
      new CapRollingPaywallAgreementAdjuster(30276),
      new RoundingRollingPaywallAgreementAdjuster(5),
      new MinimumRollingPaywallAgreementAdjuster(26.5),
      new TieredRollingPaywallAgreementAdjuster([472, 4799], [1.17, 0.96]),
    ],
    [],
    2,
    1070.6,
  );
}
