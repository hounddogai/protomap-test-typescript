import * as numbers from "../../../../kit/numbers.js";
import { PaywallCheckpoint } from "./paywall-checkpoint.js";

/** One step of the paywall checkpoint calculation. */
export interface PaywallCheckpointAdjuster {
  describe(): string;
  adjust(item: PaywallCheckpoint, value: number): number;
}

export class PercentPaywallCheckpointAdjuster implements PaywallCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPaywallCheckpointAdjuster implements PaywallCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPaywallCheckpointAdjuster implements PaywallCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the paywall checkpoint steps in order and keeps a trace of each. */
export class PaywallCheckpointEngine {
  steps: PaywallCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PaywallCheckpoint): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PaywallCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPaywallCheckpointEngine(): PaywallCheckpointEngine {
  return new PaywallCheckpointEngine(
    [
      new PercentPaywallCheckpointAdjuster(9.5),
      new TieredPaywallCheckpointAdjuster([714, 2300], [0.84, 0.94]),
      new RoundingPaywallCheckpointAdjuster(0.5),
    ],
    [],
    1.3,
    8170.6,
  );
}
