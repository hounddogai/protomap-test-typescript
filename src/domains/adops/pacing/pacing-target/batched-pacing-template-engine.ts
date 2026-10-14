import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPacingTemplate } from "./batched-pacing-template.js";

/** One step of the batched pacing template calculation. */
export interface BatchedPacingTemplateFactor {
  describe(): string;
  adjust(item: BatchedPacingTemplate, value: number): number;
}

export class RoundingBatchedPacingTemplateAdjuster implements BatchedPacingTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPacingTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedPacingTemplateAdjuster implements BatchedPacingTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPacingTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedPacingTemplateMarginOffsetAdjuster implements BatchedPacingTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: BatchedPacingTemplate, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedBatchedPacingTemplateAdjuster implements BatchedPacingTemplateFactor {
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

  adjust(item: BatchedPacingTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched pacing template steps in order and keeps a trace of each. */
export class BatchedPacingTemplateEngine {
  steps: BatchedPacingTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPacingTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedPacingTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedPacingTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedPacingTemplateEngine(flagsValue: flags.Registry): BatchedPacingTemplateEngine {
  return new BatchedPacingTemplateEngine(
    [
      new RoundingBatchedPacingTemplateAdjuster(0.5),
      new PercentBatchedPacingTemplateAdjuster(17.9),
      new BatchedPacingTemplateMarginOffsetAdjuster(0.76),
      new FlaggedBatchedPacingTemplateAdjuster(flagsValue, "batched-pacing-template-fallback", 7),
    ],
    [],
    0.2,
    51290.6,
  );
}
