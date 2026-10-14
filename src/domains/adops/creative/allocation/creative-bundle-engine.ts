import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeBundle } from "./creative-bundle.js";

/** One step of the creative bundle calculation. */
export interface CreativeBundleAdjuster {
  describe(): string;
  adjust(item: CreativeBundle, value: number): number;
}

export class CreativeBundleBidOffsetAdjuster implements CreativeBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: CreativeBundle, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingCreativeBundleAdjuster implements CreativeBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCreativeBundleAdjuster implements CreativeBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCreativeBundleAdjuster implements CreativeBundleAdjuster {
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

  adjust(item: CreativeBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleCreativeBundleAdjuster implements CreativeBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CreativeBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative bundle steps in order and keeps a trace of each. */
export class CreativeBundleEngine {
  steps: CreativeBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreativeBundle): number {
    let current = item.netTotal();
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

  evaluateAll(items: CreativeBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreativeBundleEngine(flagsValue: flags.Registry): CreativeBundleEngine {
  return new CreativeBundleEngine(
    [
      new CreativeBundleBidOffsetAdjuster(0.43),
      new RoundingCreativeBundleAdjuster(0.5),
      new TieredCreativeBundleAdjuster([5245, 7028, 9508, 9585], [1.18, 0.96, 0.91, 0.92]),
      new FlaggedCreativeBundleAdjuster(flagsValue, "creative-bundle-tiered", -8.7),
      new LocaleCreativeBundleAdjuster(
        new Map<string, number>([["retail", 1.04], ["west", 1.04], ["central", 1.36]]),
      ),
    ],
    [],
    4,
    99550.2,
  );
}
