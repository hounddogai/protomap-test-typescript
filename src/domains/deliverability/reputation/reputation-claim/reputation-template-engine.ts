import * as numbers from "../../../../kit/numbers.js";
import { ReputationTemplate } from "./reputation-template.js";

/** One step of the reputation template calculation. */
export interface ReputationTemplateFactor {
  describe(): string;
  adjust(item: ReputationTemplate, value: number): number;
}

export class MinimumReputationTemplateAdjuster implements ReputationTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ReputationTemplateVersionOffsetAdjuster implements ReputationTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ReputationTemplate, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredReputationTemplateAdjuster implements ReputationTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reputation template steps in order and keeps a trace of each. */
export class ReputationTemplateEngine {
  steps: ReputationTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReputationTemplate): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ReputationTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReputationTemplateEngine(): ReputationTemplateEngine {
  return new ReputationTemplateEngine(
    [
      new MinimumReputationTemplateAdjuster(18.6),
      new ReputationTemplateVersionOffsetAdjuster(0.47),
      new TieredReputationTemplateAdjuster([733, 2852, 5468, 7949], [0.96, 1.11, 0.88, 0.92]),
    ],
    [],
    0.9,
    23468.8,
  );
}
