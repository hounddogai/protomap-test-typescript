import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyRewardTemplate } from "./legacy-reward-template.js";

/** One step of the legacy reward template calculation. */
export interface LegacyRewardTemplateAdjuster {
  describe(): string;
  adjust(item: LegacyRewardTemplate, value: number): number;
}

export class RoundingLegacyRewardTemplateAdjuster implements LegacyRewardTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyRewardTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyRewardTemplateAdjuster implements LegacyRewardTemplateAdjuster {
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

  adjust(item: LegacyRewardTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyRewardTemplateThresholdOffsetAdjuster implements LegacyRewardTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LegacyRewardTemplate, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class TieredLegacyRewardTemplateAdjuster implements LegacyRewardTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyRewardTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLegacyRewardTemplateAdjuster implements LegacyRewardTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyRewardTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleLegacyRewardTemplateAdjuster implements LegacyRewardTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyRewardTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy reward template steps in order and keeps a trace of each. */
export class LegacyRewardTemplateEngine {
  steps: LegacyRewardTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRewardTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyRewardTemplate): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: LegacyRewardTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyRewardTemplateEngine(flagsValue: flags.Registry): LegacyRewardTemplateEngine {
  return new LegacyRewardTemplateEngine(
    [
      new RoundingLegacyRewardTemplateAdjuster(0.5),
      new FlaggedLegacyRewardTemplateAdjuster(flagsValue, "legacy-reward-template-adaptive", -0.5),
      new LegacyRewardTemplateThresholdOffsetAdjuster(0.09),
      new TieredLegacyRewardTemplateAdjuster([1580, 2662], [0.89, 0.81]),
      new CapLegacyRewardTemplateAdjuster(43696),
      new LocaleLegacyRewardTemplateAdjuster(new Map<string, number>([["north", 1.26], ["west", 1.24]])),
    ],
    [],
    5,
    46657.9,
  );
}
