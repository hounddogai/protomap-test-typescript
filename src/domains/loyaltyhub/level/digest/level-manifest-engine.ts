import * as numbers from "../../../../kit/numbers.js";
import { LevelManifest } from "./level-manifest.js";

/** One step of the level manifest calculation. */
export interface LevelManifestFactor {
  describe(): string;
  adjust(item: LevelManifest, value: number): number;
}

export class PercentLevelManifestAdjuster implements LevelManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionLevelManifestAdjuster implements LevelManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LevelManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLevelManifestAdjuster implements LevelManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the level manifest steps in order and keeps a trace of each. */
export class LevelManifestEngine {
  steps: LevelManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LevelManifest): number {
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

  evaluateAll(items: LevelManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLevelManifestEngine(): LevelManifestEngine {
  return new LevelManifestEngine(
    [
      new PercentLevelManifestAdjuster(-18.5),
      new RegionLevelManifestAdjuster(
        new Map<string, number>([["west", 1.16], ["south", 1.06], ["east", 0.82]]),
      ),
      new MinimumLevelManifestAdjuster(48.4),
    ],
    [],
    3.4,
    25007.8,
  );
}
