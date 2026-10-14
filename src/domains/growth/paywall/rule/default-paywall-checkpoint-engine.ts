import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

/** One step of the default paywall checkpoint calculation. */
export interface DefaultPaywallCheckpointAdjuster {
  describe(): string;
  adjust(item: DefaultPaywallCheckpoint, value: number): number;
}

export class DefaultPaywallCheckpointImpressionsOffsetAdjuster implements DefaultPaywallCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: DefaultPaywallCheckpoint, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingDefaultPaywallCheckpointAdjuster implements DefaultPaywallCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPaywallCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDefaultPaywallCheckpointAdjuster implements DefaultPaywallCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPaywallCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultPaywallCheckpointAdjuster implements DefaultPaywallCheckpointAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: DefaultPaywallCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultPaywallCheckpointAdjuster implements DefaultPaywallCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPaywallCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default paywall checkpoint steps in order and keeps a trace of each. */
export class DefaultPaywallCheckpointEngine {
  steps: DefaultPaywallCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPaywallCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPaywallCheckpoint): number {
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

  evaluateAll(items: DefaultPaywallCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPaywallCheckpointEngine(flagsValue: flags.Registry): DefaultPaywallCheckpointEngine {
  return new DefaultPaywallCheckpointEngine(
    [
      new DefaultPaywallCheckpointImpressionsOffsetAdjuster(1.08),
      new RoundingDefaultPaywallCheckpointAdjuster(0.25),
      new TieredDefaultPaywallCheckpointAdjuster([2274, 2491, 4636], [0.9, 0.99, 1.06]),
      new FlaggedDefaultPaywallCheckpointAdjuster(flagsValue, "default-paywall-checkpoint-manual", -3.7),
      new CapDefaultPaywallCheckpointAdjuster(43426),
    ],
    [],
    1.5,
    35577.5,
  );
}
