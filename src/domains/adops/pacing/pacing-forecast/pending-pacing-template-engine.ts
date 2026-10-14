import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPacingTemplate } from "./pending-pacing-template.js";

/** One step of the pending pacing template calculation. */
export interface PendingPacingTemplateModifier {
  describe(): string;
  adjust(item: PendingPacingTemplate, value: number): number;
}

export class PercentPendingPacingTemplateAdjuster implements PendingPacingTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPacingTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingPacingTemplateAdjuster implements PendingPacingTemplateModifier {
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

  adjust(item: PendingPacingTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingPacingTemplateAdjuster implements PendingPacingTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPacingTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryPendingPacingTemplateAdjuster implements PendingPacingTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingPacingTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending pacing template steps in order and keeps a trace of each. */
export class PendingPacingTemplateEngine {
  steps: PendingPacingTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPacingTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingPacingTemplate): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PendingPacingTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingPacingTemplateEngine(flagsValue: flags.Registry): PendingPacingTemplateEngine {
  return new PendingPacingTemplateEngine(
    [
      new PercentPendingPacingTemplateAdjuster(-17.8),
      new FlaggedPendingPacingTemplateAdjuster(flagsValue, "pending-pacing-template-default", 8.6),
      new MinimumPendingPacingTemplateAdjuster(20.9),
      new CategoryPendingPacingTemplateAdjuster(new Map<string, number>([["south", 0.95], ["west", 1.04]])),
    ],
    [],
    3.4,
    10840.7,
  );
}
