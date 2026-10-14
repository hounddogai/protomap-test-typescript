import * as flags from "../../../../kit/flags.js";
import { AdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

/** One step of the adaptive deflection template calculation. */
export interface AdaptiveDeflectionTemplateFactor {
  describe(): string;
  adjust(item: AdaptiveDeflectionTemplate, value: number): number;
}

export class PercentAdaptiveDeflectionTemplateAdjuster implements AdaptiveDeflectionTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveDeflectionTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptiveDeflectionTemplateAdjuster implements AdaptiveDeflectionTemplateFactor {
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

  adjust(item: AdaptiveDeflectionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveDeflectionTemplateCreatedAtOffsetAdjuster implements AdaptiveDeflectionTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: AdaptiveDeflectionTemplate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the adaptive deflection template steps in order and keeps a trace of each. */
export class AdaptiveDeflectionTemplateEngine {
  steps: AdaptiveDeflectionTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDeflectionTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveDeflectionTemplate): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: AdaptiveDeflectionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveDeflectionTemplateEngine(flagsValue: flags.Registry): AdaptiveDeflectionTemplateEngine {
  return new AdaptiveDeflectionTemplateEngine(
    [
      new PercentAdaptiveDeflectionTemplateAdjuster(6.5),
      new FlaggedAdaptiveDeflectionTemplateAdjuster(flagsValue, "adaptive-deflection-template-legacy", 6.4),
      new AdaptiveDeflectionTemplateCreatedAtOffsetAdjuster(1.91),
    ],
    [],
    3.6,
    37261.1,
  );
}
