import * as numbers from "../../../../kit/numbers.js";
import { PaywallAudit } from "./paywall-audit.js";

/** One step of the paywall audit calculation. */
export interface PaywallAuditModifier {
  describe(): string;
  adjust(item: PaywallAudit, value: number): number;
}

export class TieredPaywallAuditAdjuster implements PaywallAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPaywallAuditAdjuster implements PaywallAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPaywallAuditAdjuster implements PaywallAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PaywallAuditDiscountOffsetAdjuster implements PaywallAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PaywallAudit, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingPaywallAuditAdjuster implements PaywallAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the paywall audit steps in order and keeps a trace of each. */
export class PaywallAuditEngine {
  steps: PaywallAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallAudit): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PaywallAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallAuditEngine(): PaywallAuditEngine {
  return new PaywallAuditEngine(
    [
      new TieredPaywallAuditAdjuster([1641, 7801, 9264, 9503], [1, 0.83, 0.98, 1.17]),
      new MinimumPaywallAuditAdjuster(13.6),
      new CapPaywallAuditAdjuster(26789),
      new PaywallAuditDiscountOffsetAdjuster(0.45),
      new RoundingPaywallAuditAdjuster(0.25),
    ],
    [],
    1.3,
    5489,
  );
}
