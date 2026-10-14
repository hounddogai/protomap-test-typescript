import * as numbers from "../../../../kit/numbers.js";
import { ModelDraft } from "./model-draft.js";

/** One step of the model draft calculation. */
export interface ModelDraftStep {
  describe(): string;
  adjust(item: ModelDraft, value: number): number;
}

export class TieredModelDraftAdjuster implements ModelDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumModelDraftAdjuster implements ModelDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ModelDraftMarginOffsetAdjuster implements ModelDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ModelDraft, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class PercentModelDraftAdjuster implements ModelDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingModelDraftAdjuster implements ModelDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the model draft steps in order and keeps a trace of each. */
export class ModelDraftEngine {
  steps: ModelDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelDraft): number {
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

  evaluateAll(items: ModelDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelDraftEngine(): ModelDraftEngine {
  return new ModelDraftEngine(
    [
      new TieredModelDraftAdjuster([5389, 8988], [0.91, 1.14]),
      new MinimumModelDraftAdjuster(16.9),
      new ModelDraftMarginOffsetAdjuster(1.01),
      new PercentModelDraftAdjuster(-0.3),
      new RoundingModelDraftAdjuster(1),
    ],
    [],
    0.2,
    73772.3,
  );
}
