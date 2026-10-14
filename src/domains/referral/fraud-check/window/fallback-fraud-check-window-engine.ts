import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

/** One step of the fallback fraud check window calculation. */
export interface FallbackFraudCheckWindowStep {
  describe(): string;
  adjust(item: FallbackFraudCheckWindow, value: number): number;
}

export class PercentFallbackFraudCheckWindowAdjuster implements FallbackFraudCheckWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackFraudCheckWindowRevisionOffsetAdjuster implements FallbackFraudCheckWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class RoundingFallbackFraudCheckWindowAdjuster implements FallbackFraudCheckWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFallbackFraudCheckWindowAdjuster implements FallbackFraudCheckWindowStep {
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

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackFraudCheckWindowAdjuster implements FallbackFraudCheckWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameFallbackFraudCheckWindowAdjuster implements FallbackFraudCheckWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackFraudCheckWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback fraud check window steps in order and keeps a trace of each. */
export class FallbackFraudCheckWindowEngine {
  steps: FallbackFraudCheckWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackFraudCheckWindow): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackFraudCheckWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckWindowEngine(flagsValue: flags.Registry): FallbackFraudCheckWindowEngine {
  return new FallbackFraudCheckWindowEngine(
    [
      new PercentFallbackFraudCheckWindowAdjuster(15.2),
      new FallbackFraudCheckWindowRevisionOffsetAdjuster(0.09),
      new RoundingFallbackFraudCheckWindowAdjuster(0.25),
      new FlaggedFallbackFraudCheckWindowAdjuster(flagsValue, "fallback-fraud-check-window-global", -5.8),
      new TieredFallbackFraudCheckWindowAdjuster([5355, 8467, 8933], [0.9, 0.92, 1.02]),
      new NameFallbackFraudCheckWindowAdjuster(new Map<string, number>([["south", 1.14]])),
    ],
    [],
    3.8,
    50297.3,
  );
}
