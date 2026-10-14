import * as numbers from "../../../../kit/numbers.js";
import { TierRequest } from "./tier-request.js";

/** One step of the tier request calculation. */
export interface TierRequestStep {
  describe(): string;
  adjust(item: TierRequest, value: number): number;
}

export class CapTierRequestAdjuster implements TierRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTierRequestAdjuster implements TierRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTierRequestAdjuster implements TierRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTierRequestAdjuster implements TierRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TierRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tier request steps in order and keeps a trace of each. */
export class TierRequestEngine {
  steps: TierRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierRequest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: TierRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierRequestEngine(): TierRequestEngine {
  return new TierRequestEngine(
    [
      new CapTierRequestAdjuster(28393),
      new RoundingTierRequestAdjuster(1),
      new PercentTierRequestAdjuster(13.3),
      new ChannelTierRequestAdjuster(new Map<string, number>([["retail", 1.15]])),
    ],
    [],
    0.6,
    50257.6,
  );
}
