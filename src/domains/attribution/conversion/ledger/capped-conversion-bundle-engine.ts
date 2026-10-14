import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedConversionBundle } from "./capped-conversion-bundle.js";

/** One step of the capped conversion bundle calculation. */
export interface CappedConversionBundleModifier {
  describe(): string;
  adjust(item: CappedConversionBundle, value: number): number;
}

export class FlaggedCappedConversionBundleAdjuster implements CappedConversionBundleModifier {
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

  adjust(item: CappedConversionBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedConversionBundleAdjuster implements CappedConversionBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedConversionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedConversionBundleAdjuster implements CappedConversionBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedConversionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelCappedConversionBundleAdjuster implements CappedConversionBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedConversionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingCappedConversionBundleAdjuster implements CappedConversionBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedConversionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CappedConversionBundleThresholdOffsetAdjuster implements CappedConversionBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CappedConversionBundle, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the capped conversion bundle steps in order and keeps a trace of each. */
export class CappedConversionBundleEngine {
  steps: CappedConversionBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedConversionBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedConversionBundle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CappedConversionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedConversionBundleEngine(flagsValue: flags.Registry): CappedConversionBundleEngine {
  return new CappedConversionBundleEngine(
    [
      new FlaggedCappedConversionBundleAdjuster(flagsValue, "capped-conversion-bundle-lenient", -6.2),
      new PercentCappedConversionBundleAdjuster(21.4),
      new TieredCappedConversionBundleAdjuster([110, 1193, 2935], [0.91, 1.05, 0.91]),
      new LabelCappedConversionBundleAdjuster(
        new Map<string, number>([["north", 1.28], ["central", 1.04], ["east", 1.33]]),
      ),
      new RoundingCappedConversionBundleAdjuster(0.1),
      new CappedConversionBundleThresholdOffsetAdjuster(0.08),
    ],
    [],
    0.3,
    40296.3,
  );
}
