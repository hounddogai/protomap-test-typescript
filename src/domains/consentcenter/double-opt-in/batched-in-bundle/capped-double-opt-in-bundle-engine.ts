import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

/** One step of the capped double opt in bundle calculation. */
export interface CappedDoubleOptInBundleModifier {
  describe(): string;
  adjust(item: CappedDoubleOptInBundle, value: number): number;
}

export class RoundingCappedDoubleOptInBundleAdjuster implements CappedDoubleOptInBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedDoubleOptInBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedDoubleOptInBundleAdjuster implements CappedDoubleOptInBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDoubleOptInBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedDoubleOptInBundleAdjuster implements CappedDoubleOptInBundleModifier {
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

  adjust(item: CappedDoubleOptInBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped double opt in bundle steps in order and keeps a trace of each. */
export class CappedDoubleOptInBundleEngine {
  steps: CappedDoubleOptInBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDoubleOptInBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedDoubleOptInBundle): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: CappedDoubleOptInBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedDoubleOptInBundleEngine(flagsValue: flags.Registry): CappedDoubleOptInBundleEngine {
  return new CappedDoubleOptInBundleEngine(
    [
      new RoundingCappedDoubleOptInBundleAdjuster(0.1),
      new TieredCappedDoubleOptInBundleAdjuster([1903, 2581, 9649], [1.04, 1.03, 1.15]),
      new FlaggedCappedDoubleOptInBundleAdjuster(flagsValue, "capped-double-opt-in-bundle-capped", -2),
    ],
    [],
    0.5,
    90172.4,
  );
}
