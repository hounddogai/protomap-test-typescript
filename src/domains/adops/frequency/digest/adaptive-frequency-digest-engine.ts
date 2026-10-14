import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFrequencyDigest } from "./adaptive-frequency-digest.js";

/** One step of the adaptive frequency digest calculation. */
export interface AdaptiveFrequencyDigestModifier {
  describe(): string;
  adjust(item: AdaptiveFrequencyDigest, value: number): number;
}

export class NameAdaptiveFrequencyDigestAdjuster implements AdaptiveFrequencyDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingAdaptiveFrequencyDigestAdjuster implements AdaptiveFrequencyDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapAdaptiveFrequencyDigestAdjuster implements AdaptiveFrequencyDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveFrequencyDigestAdjuster implements AdaptiveFrequencyDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveFrequencyDigestAdjuster implements AdaptiveFrequencyDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveFrequencyDigestLimitOffsetAdjuster implements AdaptiveFrequencyDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: AdaptiveFrequencyDigest, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the adaptive frequency digest steps in order and keeps a trace of each. */
export class AdaptiveFrequencyDigestEngine {
  steps: AdaptiveFrequencyDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFrequencyDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveFrequencyDigest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveFrequencyDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveFrequencyDigestEngine(): AdaptiveFrequencyDigestEngine {
  return new AdaptiveFrequencyDigestEngine(
    [
      new NameAdaptiveFrequencyDigestAdjuster(
        new Map<string, number>([["north", 0.8], ["central", 1.24], ["east", 0.72]]),
      ),
      new RoundingAdaptiveFrequencyDigestAdjuster(5),
      new CapAdaptiveFrequencyDigestAdjuster(41054),
      new MinimumAdaptiveFrequencyDigestAdjuster(27.6),
      new TieredAdaptiveFrequencyDigestAdjuster([2386, 8966], [1.02, 0.89]),
      new AdaptiveFrequencyDigestLimitOffsetAdjuster(1.45),
    ],
    [],
    2,
    42560.5,
  );
}
