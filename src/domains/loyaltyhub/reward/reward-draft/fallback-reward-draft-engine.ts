import * as numbers from "../../../../kit/numbers.js";
import { FallbackRewardDraft } from "./fallback-reward-draft.js";

/** One step of the fallback reward draft calculation. */
export interface FallbackRewardDraftFactor {
  describe(): string;
  adjust(item: FallbackRewardDraft, value: number): number;
}

export class PercentFallbackRewardDraftAdjuster implements FallbackRewardDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackRewardDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackRewardDraftAdjuster implements FallbackRewardDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackRewardDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackRewardDraftAdjuster implements FallbackRewardDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackRewardDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback reward draft steps in order and keeps a trace of each. */
export class FallbackRewardDraftEngine {
  steps: FallbackRewardDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackRewardDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackRewardDraft): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackRewardDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackRewardDraftEngine(): FallbackRewardDraftEngine {
  return new FallbackRewardDraftEngine(
    [
      new PercentFallbackRewardDraftAdjuster(16.1),
      new RoundingFallbackRewardDraftAdjuster(0.05),
      new TieredFallbackRewardDraftAdjuster([6613, 9916], [0.9, 0.81]),
    ],
    [],
    2.5,
    36417.1,
  );
}
