import * as numbers from "../../../../kit/numbers.js";
import { SlaDigest } from "./sla-digest.js";

/** One step of the sla digest calculation. */
export interface SlaDigestModifier {
  describe(): string;
  adjust(item: SlaDigest, value: number): number;
}

export class PercentSlaDigestAdjuster implements SlaDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SlaDigestDiscountOffsetAdjuster implements SlaDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: SlaDigest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredSlaDigestAdjuster implements SlaDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumSlaDigestAdjuster implements SlaDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSlaDigestAdjuster implements SlaDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sla digest steps in order and keeps a trace of each. */
export class SlaDigestEngine {
  steps: SlaDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaDigest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SlaDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaDigestEngine(): SlaDigestEngine {
  return new SlaDigestEngine(
    [
      new PercentSlaDigestAdjuster(24.4),
      new SlaDigestDiscountOffsetAdjuster(1.92),
      new TieredSlaDigestAdjuster([5175, 5413], [1.2, 0.81]),
      new MinimumSlaDigestAdjuster(27.6),
      new CapSlaDigestAdjuster(27844),
    ],
    [],
    1,
    26195,
  );
}
