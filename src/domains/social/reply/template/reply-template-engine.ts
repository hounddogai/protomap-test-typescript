import * as numbers from "../../../../kit/numbers.js";
import { ReplyTemplate } from "./reply-template.js";

/** One step of the reply template calculation. */
export interface ReplyTemplateFactor {
  describe(): string;
  adjust(item: ReplyTemplate, value: number): number;
}

export class RoundingReplyTemplateAdjuster implements ReplyTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReplyTemplateScoreOffsetAdjuster implements ReplyTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ReplyTemplate, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapReplyTemplateAdjuster implements ReplyTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentReplyTemplateAdjuster implements ReplyTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceReplyTemplateAdjuster implements ReplyTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ReplyTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reply template steps in order and keeps a trace of each. */
export class ReplyTemplateEngine {
  steps: ReplyTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReplyTemplate): number {
    let current = item.netValue();
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

  evaluateAll(items: ReplyTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReplyTemplateEngine(): ReplyTemplateEngine {
  return new ReplyTemplateEngine(
    [
      new RoundingReplyTemplateAdjuster(1),
      new ReplyTemplateScoreOffsetAdjuster(1.08),
      new CapReplyTemplateAdjuster(22672),
      new PercentReplyTemplateAdjuster(-5),
      new SourceReplyTemplateAdjuster(
        new Map<string, number>([["south", 1.37], ["north", 1.32], ["central", 1.1]]),
      ),
    ],
    [],
    1.2,
    54041.5,
  );
}
