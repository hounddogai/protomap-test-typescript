import * as numbers from "../../../../kit/numbers.js";
import { FallbackFunnelAgreement } from "./fallback-funnel-agreement.js";

/** One step of the fallback funnel agreement calculation. */
export interface FallbackFunnelAgreementModifier {
  describe(): string;
  adjust(item: FallbackFunnelAgreement, value: number): number;
}

export class MinimumFallbackFunnelAgreementAdjuster implements FallbackFunnelAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFunnelAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackFunnelAgreementAdjuster implements FallbackFunnelAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFunnelAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackFunnelAgreementAdjuster implements FallbackFunnelAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackFunnelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback funnel agreement steps in order and keeps a trace of each. */
export class FallbackFunnelAgreementEngine {
  steps: FallbackFunnelAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFunnelAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFunnelAgreement): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: FallbackFunnelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFunnelAgreementEngine(): FallbackFunnelAgreementEngine {
  return new FallbackFunnelAgreementEngine(
    [
      new MinimumFallbackFunnelAgreementAdjuster(38.8),
      new PercentFallbackFunnelAgreementAdjuster(2),
      new RoundingFallbackFunnelAgreementAdjuster(0.05),
    ],
    [],
    2.6,
    25528.1,
  );
}
