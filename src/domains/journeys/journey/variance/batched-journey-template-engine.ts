import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedJourneyTemplate } from "./batched-journey-template.js";

/** One step of the batched journey template calculation. */
export interface BatchedJourneyTemplateFactor {
  describe(): string;
  adjust(item: BatchedJourneyTemplate, value: number): number;
}

export class RoundingBatchedJourneyTemplateAdjuster implements BatchedJourneyTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedJourneyTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBatchedJourneyTemplateAdjuster implements BatchedJourneyTemplateFactor {
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

  adjust(item: BatchedJourneyTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBatchedJourneyTemplateAdjuster implements BatchedJourneyTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedJourneyTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedJourneyTemplateWeightOffsetAdjuster implements BatchedJourneyTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: BatchedJourneyTemplate, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class MinimumBatchedJourneyTemplateAdjuster implements BatchedJourneyTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedJourneyTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedJourneyTemplateAdjuster implements BatchedJourneyTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedJourneyTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched journey template steps in order and keeps a trace of each. */
export class BatchedJourneyTemplateEngine {
  steps: BatchedJourneyTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedJourneyTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedJourneyTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedJourneyTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedJourneyTemplateEngine(flagsValue: flags.Registry): BatchedJourneyTemplateEngine {
  return new BatchedJourneyTemplateEngine(
    [
      new RoundingBatchedJourneyTemplateAdjuster(0.1),
      new FlaggedBatchedJourneyTemplateAdjuster(flagsValue, "batched-journey-template-pending", -0.3),
      new TieredBatchedJourneyTemplateAdjuster([3114, 8491, 8931], [0.96, 0.95, 0.86]),
      new BatchedJourneyTemplateWeightOffsetAdjuster(0.62),
      new MinimumBatchedJourneyTemplateAdjuster(17),
      new CapBatchedJourneyTemplateAdjuster(36023),
    ],
    [],
    3.6,
    81325.9,
  );
}
