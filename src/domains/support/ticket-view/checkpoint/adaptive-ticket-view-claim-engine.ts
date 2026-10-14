import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

/** One step of the adaptive ticket view claim calculation. */
export interface AdaptiveTicketViewClaimModifier {
  describe(): string;
  adjust(item: AdaptiveTicketViewClaim, value: number): number;
}

export class RoundingAdaptiveTicketViewClaimAdjuster implements AdaptiveTicketViewClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveTicketViewClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceAdaptiveTicketViewClaimAdjuster implements AdaptiveTicketViewClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: AdaptiveTicketViewClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveTicketViewClaimAdjuster implements AdaptiveTicketViewClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveTicketViewClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveTicketViewClaimAdjuster implements AdaptiveTicketViewClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveTicketViewClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveTicketViewClaimRateOffsetAdjuster implements AdaptiveTicketViewClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: AdaptiveTicketViewClaim, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the adaptive ticket view claim steps in order and keeps a trace of each. */
export class AdaptiveTicketViewClaimEngine {
  steps: AdaptiveTicketViewClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveTicketViewClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveTicketViewClaim): number {
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

  evaluateAll(items: AdaptiveTicketViewClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveTicketViewClaimEngine(): AdaptiveTicketViewClaimEngine {
  return new AdaptiveTicketViewClaimEngine(
    [
      new RoundingAdaptiveTicketViewClaimAdjuster(0.25),
      new SourceAdaptiveTicketViewClaimAdjuster(
        new Map<string, number>([["south", 1.16], ["west", 1.18], ["north", 0.9]]),
      ),
      new TieredAdaptiveTicketViewClaimAdjuster([2828, 3411, 6045, 9856], [0.89, 1.11, 1.13, 1.02]),
      new CapAdaptiveTicketViewClaimAdjuster(23127),
      new AdaptiveTicketViewClaimRateOffsetAdjuster(0.42),
    ],
    [],
    1.5,
    76335.8,
  );
}
