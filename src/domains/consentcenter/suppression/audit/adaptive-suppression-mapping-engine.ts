import * as flags from "../../../../kit/flags.js";
import { AdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

/** One step of the adaptive suppression mapping calculation. */
export interface AdaptiveSuppressionMappingModifier {
  describe(): string;
  adjust(item: AdaptiveSuppressionMapping, value: number): number;
}

export class PercentAdaptiveSuppressionMappingAdjuster implements AdaptiveSuppressionMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameAdaptiveSuppressionMappingAdjuster implements AdaptiveSuppressionMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveSuppressionMappingAdjuster implements AdaptiveSuppressionMappingModifier {
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

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveSuppressionMappingCostOffsetAdjuster implements AdaptiveSuppressionMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class CapAdaptiveSuppressionMappingAdjuster implements AdaptiveSuppressionMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveSuppressionMappingAdjuster implements AdaptiveSuppressionMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSuppressionMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive suppression mapping steps in order and keeps a trace of each. */
export class AdaptiveSuppressionMappingEngine {
  steps: AdaptiveSuppressionMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSuppressionMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveSuppressionMapping): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: AdaptiveSuppressionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveSuppressionMappingEngine(flagsValue: flags.Registry): AdaptiveSuppressionMappingEngine {
  return new AdaptiveSuppressionMappingEngine(
    [
      new PercentAdaptiveSuppressionMappingAdjuster(-23.7),
      new NameAdaptiveSuppressionMappingAdjuster(new Map<string, number>([["west", 0.91], ["north", 1.04]])),
      new FlaggedAdaptiveSuppressionMappingAdjuster(flagsValue, "adaptive-suppression-mapping-rolling", 1.4),
      new AdaptiveSuppressionMappingCostOffsetAdjuster(1.82),
      new CapAdaptiveSuppressionMappingAdjuster(46499),
      new MinimumAdaptiveSuppressionMappingAdjuster(24.3),
    ],
    [],
    3.2,
    6828.5,
  );
}
