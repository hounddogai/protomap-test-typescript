import * as numbers from "../../../../kit/numbers.js";
import { PaywallThreshold } from "./paywall-threshold.js";

/** One step of the paywall threshold calculation. */
export interface PaywallThresholdAdjuster {
  describe(): string;
  adjust(item: PaywallThreshold, value: number): number;
}

export class MinimumPaywallThresholdAdjuster implements PaywallThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PaywallThresholdThresholdOffsetAdjuster implements PaywallThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PaywallThreshold, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingPaywallThresholdAdjuster implements PaywallThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPaywallThresholdAdjuster implements PaywallThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelPaywallThresholdAdjuster implements PaywallThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PaywallThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the paywall threshold steps in order and keeps a trace of each. */
export class PaywallThresholdEngine {
  steps: PaywallThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallThreshold): number {
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

  evaluateAll(items: PaywallThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallThresholdEngine(): PaywallThresholdEngine {
  return new PaywallThresholdEngine(
    [
      new MinimumPaywallThresholdAdjuster(38.6),
      new PaywallThresholdThresholdOffsetAdjuster(1.86),
      new RoundingPaywallThresholdAdjuster(0.1),
      new CapPaywallThresholdAdjuster(23423),
      new ChannelPaywallThresholdAdjuster(new Map<string, number>([["online", 0.75]])),
    ],
    [],
    1.7,
    39688,
  );
}
