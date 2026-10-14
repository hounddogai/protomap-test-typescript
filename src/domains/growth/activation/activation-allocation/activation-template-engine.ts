import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationTemplate } from "./activation-template.js";

/** One step of the activation template calculation. */
export interface ActivationTemplateStep {
  describe(): string;
  adjust(item: ActivationTemplate, value: number): number;
}

export class CapActivationTemplateAdjuster implements ActivationTemplateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredActivationTemplateAdjuster implements ActivationTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameActivationTemplateAdjuster implements ActivationTemplateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ActivationTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingActivationTemplateAdjuster implements ActivationTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedActivationTemplateAdjuster implements ActivationTemplateStep {
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

  adjust(item: ActivationTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ActivationTemplateOpenRateOffsetAdjuster implements ActivationTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ActivationTemplate, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the activation template steps in order and keeps a trace of each. */
export class ActivationTemplateEngine {
  steps: ActivationTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationTemplate): number {
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

  evaluateAll(items: ActivationTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationTemplateEngine(flagsValue: flags.Registry): ActivationTemplateEngine {
  return new ActivationTemplateEngine(
    [
      new CapActivationTemplateAdjuster(35256),
      new TieredActivationTemplateAdjuster([3236, 3894], [0.86, 0.97]),
      new NameActivationTemplateAdjuster(new Map<string, number>([["south", 0.85]])),
      new RoundingActivationTemplateAdjuster(0.25),
      new FlaggedActivationTemplateAdjuster(flagsValue, "activation-template-batched", 1.1),
      new ActivationTemplateOpenRateOffsetAdjuster(0.38),
    ],
    [],
    2.6,
    34795.1,
  );
}
