import * as flags from "../../../../kit/flags.js";
import { AdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

/** One step of the adaptive suppression request calculation. */
export interface AdaptiveSuppressionRequestStep {
  describe(): string;
  adjust(item: AdaptiveSuppressionRequest, value: number): number;
}

export class PercentAdaptiveSuppressionRequestAdjuster implements AdaptiveSuppressionRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveSuppressionRequestThresholdOffsetAdjuster implements AdaptiveSuppressionRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapAdaptiveSuppressionRequestAdjuster implements AdaptiveSuppressionRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceAdaptiveSuppressionRequestAdjuster implements AdaptiveSuppressionRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveSuppressionRequestAdjuster implements AdaptiveSuppressionRequestStep {
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

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveSuppressionRequestAdjuster implements AdaptiveSuppressionRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSuppressionRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive suppression request steps in order and keeps a trace of each. */
export class AdaptiveSuppressionRequestEngine {
  steps: AdaptiveSuppressionRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSuppressionRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveSuppressionRequest): number {
    let current = item.netVolume();
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

  evaluateAll(items: AdaptiveSuppressionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveSuppressionRequestEngine(flagsValue: flags.Registry): AdaptiveSuppressionRequestEngine {
  return new AdaptiveSuppressionRequestEngine(
    [
      new PercentAdaptiveSuppressionRequestAdjuster(-19.8),
      new AdaptiveSuppressionRequestThresholdOffsetAdjuster(1.98),
      new CapAdaptiveSuppressionRequestAdjuster(41469),
      new UtmSourceAdaptiveSuppressionRequestAdjuster(
        new Map<string, number>([["west", 1.21], ["north", 0.89], ["east", 1.07]]),
      ),
      new FlaggedAdaptiveSuppressionRequestAdjuster(flagsValue, "adaptive-suppression-request-tiered", -7.5),
      new TieredAdaptiveSuppressionRequestAdjuster([404, 4519, 4810, 9856], [1.06, 1.11, 0.94, 0.87]),
    ],
    [],
    1.1,
    19039.4,
  );
}
