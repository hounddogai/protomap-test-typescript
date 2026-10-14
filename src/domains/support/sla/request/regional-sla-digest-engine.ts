import * as numbers from "../../../../kit/numbers.js";
import { RegionalSlaDigest } from "./regional-sla-digest.js";

/** One step of the regional sla digest calculation. */
export interface RegionalSlaDigestModifier {
  describe(): string;
  adjust(item: RegionalSlaDigest, value: number): number;
}

export class RoundingRegionalSlaDigestAdjuster implements RegionalSlaDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSlaDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalSlaDigestAdjuster implements RegionalSlaDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSlaDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalSlaDigestPriorityOffsetAdjuster implements RegionalSlaDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RegionalSlaDigest, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TieredRegionalSlaDigestAdjuster implements RegionalSlaDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSlaDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional sla digest steps in order and keeps a trace of each. */
export class RegionalSlaDigestEngine {
  steps: RegionalSlaDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSlaDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalSlaDigest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RegionalSlaDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalSlaDigestEngine(): RegionalSlaDigestEngine {
  return new RegionalSlaDigestEngine(
    [
      new RoundingRegionalSlaDigestAdjuster(0.25),
      new CapRegionalSlaDigestAdjuster(37754),
      new RegionalSlaDigestPriorityOffsetAdjuster(0.62),
      new TieredRegionalSlaDigestAdjuster([1995, 3150], [1.15, 1.16]),
    ],
    [],
    1,
    8429.8,
  );
}
