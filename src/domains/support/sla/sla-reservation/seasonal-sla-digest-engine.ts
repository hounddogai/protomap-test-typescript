import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSlaDigest } from "./seasonal-sla-digest.js";

/** One step of the seasonal sla digest calculation. */
export interface SeasonalSlaDigestAdjuster {
  describe(): string;
  adjust(item: SeasonalSlaDigest, value: number): number;
}

export class MinimumSeasonalSlaDigestAdjuster implements SeasonalSlaDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalSlaDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalSlaDigestAdjuster implements SeasonalSlaDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSlaDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelSeasonalSlaDigestAdjuster implements SeasonalSlaDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SeasonalSlaDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal sla digest steps in order and keeps a trace of each. */
export class SeasonalSlaDigestEngine {
  steps: SeasonalSlaDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSlaDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalSlaDigest): number {
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

  evaluateAll(items: SeasonalSlaDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalSlaDigestEngine(): SeasonalSlaDigestEngine {
  return new SeasonalSlaDigestEngine(
    [
      new MinimumSeasonalSlaDigestAdjuster(2.9),
      new TieredSeasonalSlaDigestAdjuster([6228, 7128, 7598, 9107], [0.82, 0.8, 0.82, 0.85]),
      new ChannelSeasonalSlaDigestAdjuster(
        new Map<string, number>([["north", 1.1], ["retail", 1.33], ["central", 1.13]]),
      ),
    ],
    [],
    0.9,
    69286.5,
  );
}
