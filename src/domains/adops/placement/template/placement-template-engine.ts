import * as flags from "../../../../kit/flags.js";
import { PlacementTemplate } from "./placement-template.js";

/** One step of the placement template calculation. */
export interface PlacementTemplateModifier {
  describe(): string;
  adjust(item: PlacementTemplate, value: number): number;
}

export class PlacementTemplateAttemptsOffsetAdjuster implements PlacementTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: PlacementTemplate, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapPlacementTemplateAdjuster implements PlacementTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPlacementTemplateAdjuster implements PlacementTemplateModifier {
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

  adjust(item: PlacementTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPlacementTemplateAdjuster implements PlacementTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPlacementTemplateAdjuster implements PlacementTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the placement template steps in order and keeps a trace of each. */
export class PlacementTemplateEngine {
  steps: PlacementTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementTemplate): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PlacementTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementTemplateEngine(flagsValue: flags.Registry): PlacementTemplateEngine {
  return new PlacementTemplateEngine(
    [
      new PlacementTemplateAttemptsOffsetAdjuster(1.95),
      new CapPlacementTemplateAdjuster(48468),
      new FlaggedPlacementTemplateAdjuster(flagsValue, "placement-template-default", 6.4),
      new PercentPlacementTemplateAdjuster(-15.9),
      new TieredPlacementTemplateAdjuster([2933, 9569], [1.14, 0.98]),
    ],
    [],
    3,
    2989,
  );
}
