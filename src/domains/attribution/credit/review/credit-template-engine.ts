import * as numbers from "../../../../kit/numbers.js";
import { CreditTemplate } from "./credit-template.js";

/** One step of the credit template calculation. */
export interface CreditTemplateFactor {
  describe(): string;
  adjust(item: CreditTemplate, value: number): number;
}

export class CreditTemplateThresholdOffsetAdjuster implements CreditTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CreditTemplate, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentCreditTemplateAdjuster implements CreditTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCreditTemplateAdjuster implements CreditTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the credit template steps in order and keeps a trace of each. */
export class CreditTemplateEngine {
  steps: CreditTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditTemplate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: CreditTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditTemplateEngine(): CreditTemplateEngine {
  return new CreditTemplateEngine(
    [
      new CreditTemplateThresholdOffsetAdjuster(0.9),
      new PercentCreditTemplateAdjuster(24.3),
      new RoundingCreditTemplateAdjuster(5),
    ],
    [],
    1.7,
    25328.8,
  );
}
