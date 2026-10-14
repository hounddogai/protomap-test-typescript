import * as numbers from "../../../../kit/numbers.js";
import { WeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

/** One step of the weighted double opt in manifest calculation. */
export interface WeightedDoubleOptInManifestModifier {
  describe(): string;
  adjust(item: WeightedDoubleOptInManifest, value: number): number;
}

export class CapWeightedDoubleOptInManifestAdjuster implements WeightedDoubleOptInManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedDoubleOptInManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedDoubleOptInManifestAdjuster implements WeightedDoubleOptInManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedDoubleOptInManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedDoubleOptInManifestRevisionOffsetAdjuster implements WeightedDoubleOptInManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: WeightedDoubleOptInManifest, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class ChannelWeightedDoubleOptInManifestAdjuster implements WeightedDoubleOptInManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedDoubleOptInManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWeightedDoubleOptInManifestAdjuster implements WeightedDoubleOptInManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedDoubleOptInManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted double opt in manifest steps in order and keeps a trace of each. */
export class WeightedDoubleOptInManifestEngine {
  steps: WeightedDoubleOptInManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDoubleOptInManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedDoubleOptInManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedDoubleOptInManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedDoubleOptInManifestEngine(): WeightedDoubleOptInManifestEngine {
  return new WeightedDoubleOptInManifestEngine(
    [
      new CapWeightedDoubleOptInManifestAdjuster(36814),
      new TieredWeightedDoubleOptInManifestAdjuster([8237, 9674], [0.8, 1.16]),
      new WeightedDoubleOptInManifestRevisionOffsetAdjuster(0.47),
      new ChannelWeightedDoubleOptInManifestAdjuster(new Map<string, number>([["retail", 1.3]])),
      new RoundingWeightedDoubleOptInManifestAdjuster(0.25),
    ],
    [],
    2.1,
    5152.9,
  );
}
