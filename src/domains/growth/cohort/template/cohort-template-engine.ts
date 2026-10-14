import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortTemplate } from "./cohort-template.js";

/** One step of the cohort template calculation. */
export interface CohortTemplateFactor {
  describe(): string;
  adjust(item: CohortTemplate, value: number): number;
}

export class TieredCohortTemplateAdjuster implements CohortTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelCohortTemplateAdjuster implements CohortTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CohortTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CohortTemplateMarginOffsetAdjuster implements CohortTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: CohortTemplate, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedCohortTemplateAdjuster implements CohortTemplateFactor {
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

  adjust(item: CohortTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCohortTemplateAdjuster implements CohortTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the cohort template steps in order and keeps a trace of each. */
export class CohortTemplateEngine {
  steps: CohortTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortTemplate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CohortTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortTemplateEngine(flagsValue: flags.Registry): CohortTemplateEngine {
  return new CohortTemplateEngine(
    [
      new TieredCohortTemplateAdjuster([1575, 2705, 6226, 9784], [1.12, 0.94, 1.13, 0.97]),
      new LabelCohortTemplateAdjuster(new Map<string, number>([["east", 1.26]])),
      new CohortTemplateMarginOffsetAdjuster(0.4),
      new FlaggedCohortTemplateAdjuster(flagsValue, "cohort-template-capped", 7.7),
      new RoundingCohortTemplateAdjuster(0.25),
    ],
    [],
    4.2,
    22229.6,
  );
}
