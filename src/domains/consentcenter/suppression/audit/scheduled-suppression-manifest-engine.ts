import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSuppressionManifest } from "./scheduled-suppression-manifest.js";

/** One step of the scheduled suppression manifest calculation. */
export interface ScheduledSuppressionManifestFactor {
  describe(): string;
  adjust(item: ScheduledSuppressionManifest, value: number): number;
}

export class TieredScheduledSuppressionManifestAdjuster implements ScheduledSuppressionManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSuppressionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumScheduledSuppressionManifestAdjuster implements ScheduledSuppressionManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledSuppressionManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledSuppressionManifestAdjuster implements ScheduledSuppressionManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSuppressionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled suppression manifest steps in order and keeps a trace of each. */
export class ScheduledSuppressionManifestEngine {
  steps: ScheduledSuppressionManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSuppressionManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledSuppressionManifest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ScheduledSuppressionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledSuppressionManifestEngine(): ScheduledSuppressionManifestEngine {
  return new ScheduledSuppressionManifestEngine(
    [
      new TieredScheduledSuppressionManifestAdjuster([366, 4318, 8685], [0.94, 1.14, 1.07]),
      new MinimumScheduledSuppressionManifestAdjuster(28),
      new PercentScheduledSuppressionManifestAdjuster(-0.4),
    ],
    [],
    1.1,
    94027.8,
  );
}
