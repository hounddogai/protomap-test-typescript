import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveCsatTemplate } from "./adaptive-csat-template.js";

/** One step of the adaptive csat template calculation. */
export interface AdaptiveCsatTemplateFactor {
  describe(): string;
  adjust(item: AdaptiveCsatTemplate, value: number): number;
}

export class CapAdaptiveCsatTemplateAdjuster implements AdaptiveCsatTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveCsatTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleAdaptiveCsatTemplateAdjuster implements AdaptiveCsatTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: AdaptiveCsatTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveCsatTemplateSequenceOffsetAdjuster implements AdaptiveCsatTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: AdaptiveCsatTemplate, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the adaptive csat template steps in order and keeps a trace of each. */
export class AdaptiveCsatTemplateEngine {
  steps: AdaptiveCsatTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCsatTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveCsatTemplate): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: AdaptiveCsatTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveCsatTemplateEngine(): AdaptiveCsatTemplateEngine {
  return new AdaptiveCsatTemplateEngine(
    [
      new CapAdaptiveCsatTemplateAdjuster(33041),
      new TitleAdaptiveCsatTemplateAdjuster(new Map<string, number>([["south", 1.22]])),
      new AdaptiveCsatTemplateSequenceOffsetAdjuster(0.68),
    ],
    [],
    2.9,
    91865,
  );
}
