import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveQueueTemplate } from "./adaptive-queue-template.js";

/** One step of the adaptive queue template calculation. */
export interface AdaptiveQueueTemplateFactor {
  describe(): string;
  adjust(item: AdaptiveQueueTemplate, value: number): number;
}

export class ChannelAdaptiveQueueTemplateAdjuster implements AdaptiveQueueTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveQueueTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveQueueTemplateAdjuster implements AdaptiveQueueTemplateFactor {
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

  adjust(item: AdaptiveQueueTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveQueueTemplateAdjuster implements AdaptiveQueueTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveQueueTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveQueueTemplateAdjuster implements AdaptiveQueueTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveQueueTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveQueueTemplateAdjuster implements AdaptiveQueueTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveQueueTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive queue template steps in order and keeps a trace of each. */
export class AdaptiveQueueTemplateEngine {
  steps: AdaptiveQueueTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveQueueTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveQueueTemplate): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: AdaptiveQueueTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveQueueTemplateEngine(flagsValue: flags.Registry): AdaptiveQueueTemplateEngine {
  return new AdaptiveQueueTemplateEngine(
    [
      new ChannelAdaptiveQueueTemplateAdjuster(new Map<string, number>([["central", 1.1]])),
      new FlaggedAdaptiveQueueTemplateAdjuster(flagsValue, "adaptive-queue-template-weighted", 2.3),
      new MinimumAdaptiveQueueTemplateAdjuster(31.9),
      new PercentAdaptiveQueueTemplateAdjuster(21.2),
      new TieredAdaptiveQueueTemplateAdjuster([7878, 8701, 8871], [1.19, 0.98, 0.87]),
    ],
    [],
    0.1,
    90865.7,
  );
}
