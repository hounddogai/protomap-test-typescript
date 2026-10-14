import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSuppressionManifest } from "./tiered-suppression-manifest.js";

/** One step of the tiered suppression manifest calculation. */
export interface TieredSuppressionManifestAdjuster {
  describe(): string;
  adjust(item: TieredSuppressionManifest, value: number): number;
}

export class TieredSuppressionManifestExpiresAtOffsetAdjuster implements TieredSuppressionManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredSuppressionManifest, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class TitleTieredSuppressionManifestAdjuster implements TieredSuppressionManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredSuppressionManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredSuppressionManifestAdjuster implements TieredSuppressionManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSuppressionManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredSuppressionManifestAdjuster implements TieredSuppressionManifestAdjuster {
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

  adjust(item: TieredSuppressionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredSuppressionManifestAdjuster implements TieredSuppressionManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredSuppressionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered suppression manifest steps in order and keeps a trace of each. */
export class TieredSuppressionManifestEngine {
  steps: TieredSuppressionManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSuppressionManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSuppressionManifest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: TieredSuppressionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSuppressionManifestEngine(flagsValue: flags.Registry): TieredSuppressionManifestEngine {
  return new TieredSuppressionManifestEngine(
    [
      new TieredSuppressionManifestExpiresAtOffsetAdjuster(0.53),
      new TitleTieredSuppressionManifestAdjuster(new Map<string, number>([["south", 1.39]])),
      new TieredTieredSuppressionManifestAdjuster([4799, 8542], [1.13, 1.11]),
      new FlaggedTieredSuppressionManifestAdjuster(flagsValue, "tiered-suppression-manifest-lenient", 8.2),
      new PercentTieredSuppressionManifestAdjuster(15.5),
    ],
    [],
    2.8,
    53273.4,
  );
}
