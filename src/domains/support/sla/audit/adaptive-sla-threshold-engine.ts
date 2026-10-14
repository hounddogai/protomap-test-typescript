import * as flags from "../../../../kit/flags.js";
import { AdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

/** One step of the adaptive sla threshold calculation. */
export interface AdaptiveSlaThresholdModifier {
  describe(): string;
  adjust(item: AdaptiveSlaThreshold, value: number): number;
}

export class NameAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
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

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveSlaThresholdAdjuster implements AdaptiveSlaThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSlaThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive sla threshold steps in order and keeps a trace of each. */
export class AdaptiveSlaThresholdEngine {
  steps: AdaptiveSlaThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSlaThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveSlaThreshold): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: AdaptiveSlaThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveSlaThresholdEngine(flagsValue: flags.Registry): AdaptiveSlaThresholdEngine {
  return new AdaptiveSlaThresholdEngine(
    [
      new NameAdaptiveSlaThresholdAdjuster(new Map<string, number>([["online", 0.82]])),
      new TieredAdaptiveSlaThresholdAdjuster([5929, 8104, 9583], [0.9, 1.01, 1.15]),
      new FlaggedAdaptiveSlaThresholdAdjuster(flagsValue, "adaptive-sla-threshold-weighted", -6.7),
      new CapAdaptiveSlaThresholdAdjuster(18207),
      new PercentAdaptiveSlaThresholdAdjuster(7.7),
      new MinimumAdaptiveSlaThresholdAdjuster(7.5),
    ],
    [],
    0.7,
    99010.1,
  );
}
