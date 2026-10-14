import * as numbers from "../../../../kit/numbers.js";
import { BatchedPaywallTemplate } from "./batched-paywall-template.js";

/** One step of the batched paywall template calculation. */
export interface BatchedPaywallTemplateFactor {
  describe(): string;
  adjust(item: BatchedPaywallTemplate, value: number): number;
}

export class TitleBatchedPaywallTemplateAdjuster implements BatchedPaywallTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBatchedPaywallTemplateAdjuster implements BatchedPaywallTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BatchedPaywallTemplateLimitOffsetAdjuster implements BatchedPaywallTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapBatchedPaywallTemplateAdjuster implements BatchedPaywallTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBatchedPaywallTemplateAdjuster implements BatchedPaywallTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedPaywallTemplateAdjuster implements BatchedPaywallTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPaywallTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched paywall template steps in order and keeps a trace of each. */
export class BatchedPaywallTemplateEngine {
  steps: BatchedPaywallTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPaywallTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedPaywallTemplate): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: BatchedPaywallTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedPaywallTemplateEngine(): BatchedPaywallTemplateEngine {
  return new BatchedPaywallTemplateEngine(
    [
      new TitleBatchedPaywallTemplateAdjuster(
        new Map<string, number>([["west", 1.02], ["east", 1.12], ["central", 0.77]]),
      ),
      new RoundingBatchedPaywallTemplateAdjuster(5),
      new BatchedPaywallTemplateLimitOffsetAdjuster(0.28),
      new CapBatchedPaywallTemplateAdjuster(47187),
      new TieredBatchedPaywallTemplateAdjuster([1446, 4981, 8001], [1.16, 0.8, 0.88]),
      new MinimumBatchedPaywallTemplateAdjuster(23.6),
    ],
    [],
    4.5,
    46960,
  );
}
