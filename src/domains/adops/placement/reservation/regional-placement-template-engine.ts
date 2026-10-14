import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPlacementTemplate } from "./regional-placement-template.js";

/** One step of the regional placement template calculation. */
export interface RegionalPlacementTemplateFactor {
  describe(): string;
  adjust(item: RegionalPlacementTemplate, value: number): number;
}

export class RegionalPlacementTemplateImpressionsOffsetAdjuster implements RegionalPlacementTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: RegionalPlacementTemplate, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredRegionalPlacementTemplateAdjuster implements RegionalPlacementTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPlacementTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalPlacementTemplateAdjuster implements RegionalPlacementTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPlacementTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRegionalPlacementTemplateAdjuster implements RegionalPlacementTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPlacementTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalPlacementTemplateAdjuster implements RegionalPlacementTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPlacementTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRegionalPlacementTemplateAdjuster implements RegionalPlacementTemplateFactor {
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

  adjust(item: RegionalPlacementTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional placement template steps in order and keeps a trace of each. */
export class RegionalPlacementTemplateEngine {
  steps: RegionalPlacementTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPlacementTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalPlacementTemplate): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RegionalPlacementTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalPlacementTemplateEngine(flagsValue: flags.Registry): RegionalPlacementTemplateEngine {
  return new RegionalPlacementTemplateEngine(
    [
      new RegionalPlacementTemplateImpressionsOffsetAdjuster(0.21),
      new TieredRegionalPlacementTemplateAdjuster([1538, 2387, 4128, 8937], [1.14, 0.91, 0.88, 1.08]),
      new RoundingRegionalPlacementTemplateAdjuster(0.1),
      new PercentRegionalPlacementTemplateAdjuster(-10.8),
      new CapRegionalPlacementTemplateAdjuster(45672),
      new FlaggedRegionalPlacementTemplateAdjuster(flagsValue, "regional-placement-template-tiered", 8.8),
    ],
    [],
    1.6,
    34678.3,
  );
}
