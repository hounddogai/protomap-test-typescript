import * as numbers from "../../../../kit/numbers.js";
import { LenientInviteEstimate } from "./lenient-invite-estimate.js";

/** One step of the lenient invite estimate calculation. */
export interface LenientInviteEstimateModifier {
  describe(): string;
  adjust(item: LenientInviteEstimate, value: number): number;
}

export class TieredLenientInviteEstimateAdjuster implements LenientInviteEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientInviteEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientInviteEstimateAdjuster implements LenientInviteEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientInviteEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientInviteEstimateAdjuster implements LenientInviteEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientInviteEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient invite estimate steps in order and keeps a trace of each. */
export class LenientInviteEstimateEngine {
  steps: LenientInviteEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientInviteEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientInviteEstimate): number {
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

  evaluateAll(items: LenientInviteEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientInviteEstimateEngine(): LenientInviteEstimateEngine {
  return new LenientInviteEstimateEngine(
    [
      new TieredLenientInviteEstimateAdjuster([1692, 3527], [1.03, 0.87]),
      new CapLenientInviteEstimateAdjuster(38364),
      new PercentLenientInviteEstimateAdjuster(23.6),
    ],
    [],
    3.2,
    66752,
  );
}
