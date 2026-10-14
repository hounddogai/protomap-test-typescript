import * as numbers from "../../../../kit/numbers.js";
import { CappedCsatManifest } from "./capped-csat-manifest.js";

/** One step of the capped csat manifest calculation. */
export interface CappedCsatManifestModifier {
  describe(): string;
  adjust(item: CappedCsatManifest, value: number): number;
}

export class SegmentCappedCsatManifestAdjuster implements CappedCsatManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: CappedCsatManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCappedCsatManifestAdjuster implements CappedCsatManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedCsatManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CappedCsatManifestUpdatedAtOffsetAdjuster implements CappedCsatManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: CappedCsatManifest, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class TieredCappedCsatManifestAdjuster implements CappedCsatManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedCsatManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped csat manifest steps in order and keeps a trace of each. */
export class CappedCsatManifestEngine {
  steps: CappedCsatManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCsatManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedCsatManifest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CappedCsatManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedCsatManifestEngine(): CappedCsatManifestEngine {
  return new CappedCsatManifestEngine(
    [
      new SegmentCappedCsatManifestAdjuster(new Map<string, number>([["online", 0.96], ["east", 0.72]])),
      new MinimumCappedCsatManifestAdjuster(25.4),
      new CappedCsatManifestUpdatedAtOffsetAdjuster(1.29),
      new TieredCappedCsatManifestAdjuster([1372, 3370, 7141], [0.94, 1, 0.84]),
    ],
    [],
    1.5,
    19566.8,
  );
}
