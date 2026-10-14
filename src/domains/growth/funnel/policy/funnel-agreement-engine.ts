import * as numbers from "../../../../kit/numbers.js";
import { FunnelAgreement } from "./funnel-agreement.js";

/** One step of the funnel agreement calculation. */
export interface FunnelAgreementModifier {
  describe(): string;
  adjust(item: FunnelAgreement, value: number): number;
}

export class RoundingFunnelAgreementAdjuster implements FunnelAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFunnelAgreementAdjuster implements FunnelAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFunnelAgreementAdjuster implements FunnelAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the funnel agreement steps in order and keeps a trace of each. */
export class FunnelAgreementEngine {
  steps: FunnelAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FunnelAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FunnelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFunnelAgreementEngine(): FunnelAgreementEngine {
  return new FunnelAgreementEngine(
    [
      new RoundingFunnelAgreementAdjuster(0.5),
      new TieredFunnelAgreementAdjuster([3414, 4962], [1.03, 1.09]),
      new MinimumFunnelAgreementAdjuster(6.3),
    ],
    [],
    3.8,
    40964.8,
  );
}
