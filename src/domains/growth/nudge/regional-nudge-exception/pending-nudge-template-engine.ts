import * as numbers from "../../../../kit/numbers.js";
import { PendingNudgeTemplate } from "./pending-nudge-template.js";

/** One step of the pending nudge template calculation. */
export interface PendingNudgeTemplateFactor {
  describe(): string;
  adjust(item: PendingNudgeTemplate, value: number): number;
}

export class TieredPendingNudgeTemplateAdjuster implements PendingNudgeTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingNudgeTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingNudgeTemplateAdjuster implements PendingNudgeTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingNudgeTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingNudgeTemplateImpressionsOffsetAdjuster implements PendingNudgeTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PendingNudgeTemplate, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingPendingNudgeTemplateAdjuster implements PendingNudgeTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingNudgeTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingNudgeTemplateAdjuster implements PendingNudgeTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingNudgeTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending nudge template steps in order and keeps a trace of each. */
export class PendingNudgeTemplateEngine {
  steps: PendingNudgeTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingNudgeTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingNudgeTemplate): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PendingNudgeTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingNudgeTemplateEngine(): PendingNudgeTemplateEngine {
  return new PendingNudgeTemplateEngine(
    [
      new TieredPendingNudgeTemplateAdjuster([4585, 9038], [0.87, 1.07]),
      new CapPendingNudgeTemplateAdjuster(7704),
      new PendingNudgeTemplateImpressionsOffsetAdjuster(0.89),
      new RoundingPendingNudgeTemplateAdjuster(0.1),
      new PercentPendingNudgeTemplateAdjuster(22.9),
    ],
    [],
    0.1,
    85656.3,
  );
}
