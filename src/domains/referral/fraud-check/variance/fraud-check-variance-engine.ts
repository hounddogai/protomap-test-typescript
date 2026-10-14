import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckVariance } from "./fraud-check-variance.js";

/** One step of the fraud check variance calculation. */
export interface FraudCheckVarianceModifier {
  describe(): string;
  adjust(item: FraudCheckVariance, value: number): number;
}

export class RoundingFraudCheckVarianceAdjuster implements FraudCheckVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFraudCheckVarianceAdjuster implements FraudCheckVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleFraudCheckVarianceAdjuster implements FraudCheckVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FraudCheckVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FraudCheckVarianceMinimumOffsetAdjuster implements FraudCheckVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: FraudCheckVariance, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class CapFraudCheckVarianceAdjuster implements FraudCheckVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFraudCheckVarianceAdjuster implements FraudCheckVarianceModifier {
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

  adjust(item: FraudCheckVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check variance steps in order and keeps a trace of each. */
export class FraudCheckVarianceEngine {
  steps: FraudCheckVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FraudCheckVariance): number {
    let current = item.netVolume();
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

  evaluateAll(items: FraudCheckVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFraudCheckVarianceEngine(flagsValue: flags.Registry): FraudCheckVarianceEngine {
  return new FraudCheckVarianceEngine(
    [
      new RoundingFraudCheckVarianceAdjuster(1),
      new TieredFraudCheckVarianceAdjuster([1441, 1653, 3642], [0.85, 1.19, 1.16]),
      new LocaleFraudCheckVarianceAdjuster(new Map<string, number>([["retail", 1.22]])),
      new FraudCheckVarianceMinimumOffsetAdjuster(0.49),
      new CapFraudCheckVarianceAdjuster(34353),
      new FlaggedFraudCheckVarianceAdjuster(flagsValue, "fraud-check-variance-strict", -2),
    ],
    [],
    0.7,
    63580.5,
  );
}
