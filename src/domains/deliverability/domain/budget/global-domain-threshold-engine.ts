import * as numbers from "../../../../kit/numbers.js";
import { GlobalDomainThreshold } from "./global-domain-threshold.js";

/** One step of the global domain threshold calculation. */
export interface GlobalDomainThresholdModifier {
  describe(): string;
  adjust(item: GlobalDomainThreshold, value: number): number;
}

export class CapGlobalDomainThresholdAdjuster implements GlobalDomainThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalDomainThresholdAdjuster implements GlobalDomainThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalDomainThresholdAdjuster implements GlobalDomainThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class GlobalDomainThresholdScoreOffsetAdjuster implements GlobalDomainThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredGlobalDomainThresholdAdjuster implements GlobalDomainThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalDomainThresholdAdjuster implements GlobalDomainThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalDomainThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global domain threshold steps in order and keeps a trace of each. */
export class GlobalDomainThresholdEngine {
  steps: GlobalDomainThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDomainThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalDomainThreshold): number {
    let current = item.measuredValue();
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

  evaluateAll(items: GlobalDomainThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalDomainThresholdEngine(): GlobalDomainThresholdEngine {
  return new GlobalDomainThresholdEngine(
    [
      new CapGlobalDomainThresholdAdjuster(8175),
      new PercentGlobalDomainThresholdAdjuster(-12.2),
      new MinimumGlobalDomainThresholdAdjuster(48.6),
      new GlobalDomainThresholdScoreOffsetAdjuster(0.63),
      new TieredGlobalDomainThresholdAdjuster([1294, 1883, 2797], [0.96, 0.94, 0.84]),
      new RoundingGlobalDomainThresholdAdjuster(0.05),
    ],
    [],
    4.1,
    15906.5,
  );
}
