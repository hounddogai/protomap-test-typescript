import * as numbers from "../../../../kit/numbers.js";
import { ApprovalTemplate } from "./approval-template.js";

/** One step of the approval template calculation. */
export interface ApprovalTemplateAdjuster {
  describe(): string;
  adjust(item: ApprovalTemplate, value: number): number;
}

export class PercentApprovalTemplateAdjuster implements ApprovalTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingApprovalTemplateAdjuster implements ApprovalTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleApprovalTemplateAdjuster implements ApprovalTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ApprovalTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ApprovalTemplateQuantityOffsetAdjuster implements ApprovalTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ApprovalTemplate, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the approval template steps in order and keeps a trace of each. */
export class ApprovalTemplateEngine {
  steps: ApprovalTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ApprovalTemplate): number {
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

  evaluateAll(items: ApprovalTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultApprovalTemplateEngine(): ApprovalTemplateEngine {
  return new ApprovalTemplateEngine(
    [
      new PercentApprovalTemplateAdjuster(24),
      new RoundingApprovalTemplateAdjuster(1),
      new TitleApprovalTemplateAdjuster(
        new Map<string, number>([["online", 0.79], ["retail", 0.72], ["north", 1.09]]),
      ),
      new ApprovalTemplateQuantityOffsetAdjuster(0.96),
    ],
    [],
    0.2,
    47710.1,
  );
}
