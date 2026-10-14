import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBounceRollup } from "./fallback-bounce-rollup.js";

/** One step of the fallback bounce rollup calculation. */
export interface FallbackBounceRollupModifier {
  describe(): string;
  adjust(item: FallbackBounceRollup, value: number): number;
}

export class FlaggedFallbackBounceRollupAdjuster implements FallbackBounceRollupModifier {
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

  adjust(item: FallbackBounceRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackBounceRollupAdjuster implements FallbackBounceRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBounceRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FallbackBounceRollupUpdatedAtOffsetAdjuster implements FallbackBounceRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: FallbackBounceRollup, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class NameFallbackBounceRollupAdjuster implements FallbackBounceRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackBounceRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFallbackBounceRollupAdjuster implements FallbackBounceRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBounceRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback bounce rollup steps in order and keeps a trace of each. */
export class FallbackBounceRollupEngine {
  steps: FallbackBounceRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBounceRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackBounceRollup): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackBounceRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackBounceRollupEngine(flagsValue: flags.Registry): FallbackBounceRollupEngine {
  return new FallbackBounceRollupEngine(
    [
      new FlaggedFallbackBounceRollupAdjuster(flagsValue, "fallback-bounce-rollup-manual", 4.4),
      new TieredFallbackBounceRollupAdjuster([989, 1572, 6003, 9784], [0.95, 0.88, 1.03, 0.8]),
      new FallbackBounceRollupUpdatedAtOffsetAdjuster(1.56),
      new NameFallbackBounceRollupAdjuster(new Map<string, number>([["central", 1.06]])),
      new PercentFallbackBounceRollupAdjuster(-8.6),
    ],
    [],
    2.7,
    62184.2,
  );
}
