import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultActivationTemplate } from "./default-activation-template.js";

/** One step of the default activation template calculation. */
export interface DefaultActivationTemplateFactor {
  describe(): string;
  adjust(item: DefaultActivationTemplate, value: number): number;
}

export class CapDefaultActivationTemplateAdjuster implements DefaultActivationTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultActivationTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultActivationTemplateAdjuster implements DefaultActivationTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultActivationTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDefaultActivationTemplateAdjuster implements DefaultActivationTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultActivationTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDefaultActivationTemplateAdjuster implements DefaultActivationTemplateFactor {
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

  adjust(item: DefaultActivationTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default activation template steps in order and keeps a trace of each. */
export class DefaultActivationTemplateEngine {
  steps: DefaultActivationTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultActivationTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultActivationTemplate): number {
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

  evaluateAll(items: DefaultActivationTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultActivationTemplateEngine(flagsValue: flags.Registry): DefaultActivationTemplateEngine {
  return new DefaultActivationTemplateEngine(
    [
      new CapDefaultActivationTemplateAdjuster(20824),
      new RoundingDefaultActivationTemplateAdjuster(0.5),
      new MinimumDefaultActivationTemplateAdjuster(40.2),
      new FlaggedDefaultActivationTemplateAdjuster(flagsValue, "default-activation-template-manual", 2.3),
    ],
    [],
    3.1,
    27702.8,
  );
}
