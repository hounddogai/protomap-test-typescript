import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

/** One step of the weighted ticket view digest calculation. */
export interface WeightedTicketViewDigestAdjuster {
  describe(): string;
  adjust(item: WeightedTicketViewDigest, value: number): number;
}

export class CapWeightedTicketViewDigestAdjuster implements WeightedTicketViewDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedTicketViewDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedTicketViewDigestAdjuster implements WeightedTicketViewDigestAdjuster {
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

  adjust(item: WeightedTicketViewDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedTicketViewDigestAdjuster implements WeightedTicketViewDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTicketViewDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWeightedTicketViewDigestAdjuster implements WeightedTicketViewDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedTicketViewDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedTicketViewDigestQuantityOffsetAdjuster implements WeightedTicketViewDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: WeightedTicketViewDigest, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumWeightedTicketViewDigestAdjuster implements WeightedTicketViewDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedTicketViewDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted ticket view digest steps in order and keeps a trace of each. */
export class WeightedTicketViewDigestEngine {
  steps: WeightedTicketViewDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTicketViewDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedTicketViewDigest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WeightedTicketViewDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedTicketViewDigestEngine(flagsValue: flags.Registry): WeightedTicketViewDigestEngine {
  return new WeightedTicketViewDigestEngine(
    [
      new CapWeightedTicketViewDigestAdjuster(45520),
      new FlaggedWeightedTicketViewDigestAdjuster(flagsValue, "weighted-ticket-view-digest-regional", -0.4),
      new RoundingWeightedTicketViewDigestAdjuster(0.05),
      new TieredWeightedTicketViewDigestAdjuster([1081, 5335], [1.09, 0.82]),
      new WeightedTicketViewDigestQuantityOffsetAdjuster(0.58),
      new MinimumWeightedTicketViewDigestAdjuster(5.9),
    ],
    [],
    3.4,
    60994.1,
  );
}
