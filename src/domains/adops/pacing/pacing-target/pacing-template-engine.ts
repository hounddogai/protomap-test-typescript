import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingTemplate } from "./pacing-template.js";

/** One step of the pacing template calculation. */
export interface PacingTemplateFactor {
  describe(): string;
  adjust(item: PacingTemplate, value: number): number;
}

export class RoundingPacingTemplateAdjuster implements PacingTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPacingTemplateAdjuster implements PacingTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PacingTemplateBatchSizeOffsetAdjuster implements PacingTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: PacingTemplate, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedPacingTemplateAdjuster implements PacingTemplateFactor {
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

  adjust(item: PacingTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPacingTemplateAdjuster implements PacingTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourcePacingTemplateAdjuster implements PacingTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PacingTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pacing template steps in order and keeps a trace of each. */
export class PacingTemplateEngine {
  steps: PacingTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PacingTemplate): number {
    let current = item.netVolume();
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

  evaluateAll(items: PacingTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPacingTemplateEngine(flagsValue: flags.Registry): PacingTemplateEngine {
  return new PacingTemplateEngine(
    [
      new RoundingPacingTemplateAdjuster(0.5),
      new MinimumPacingTemplateAdjuster(17.6),
      new PacingTemplateBatchSizeOffsetAdjuster(1.42),
      new FlaggedPacingTemplateAdjuster(flagsValue, "pacing-template-primary", -6.3),
      new TieredPacingTemplateAdjuster([678, 1638, 7448, 8072], [0.96, 0.92, 1.04, 1]),
      new UtmSourcePacingTemplateAdjuster(new Map<string, number>([["retail", 0.73], ["east", 1]])),
    ],
    [],
    2.4,
    35614.6,
  );
}
