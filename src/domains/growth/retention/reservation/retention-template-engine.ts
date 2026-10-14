import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionTemplate } from "./retention-template.js";

/** One step of the retention template calculation. */
export interface RetentionTemplateModifier {
  describe(): string;
  adjust(item: RetentionTemplate, value: number): number;
}

export class FlaggedRetentionTemplateAdjuster implements RetentionTemplateModifier {
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

  adjust(item: RetentionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RetentionTemplateDiscountOffsetAdjuster implements RetentionTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RetentionTemplate, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class CapRetentionTemplateAdjuster implements RetentionTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the retention template steps in order and keeps a trace of each. */
export class RetentionTemplateEngine {
  steps: RetentionTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RetentionTemplate): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RetentionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRetentionTemplateEngine(flagsValue: flags.Registry): RetentionTemplateEngine {
  return new RetentionTemplateEngine(
    [
      new FlaggedRetentionTemplateAdjuster(flagsValue, "retention-template-rolling", -7),
      new RetentionTemplateDiscountOffsetAdjuster(1.75),
      new CapRetentionTemplateAdjuster(22601),
    ],
    [],
    0.7,
    20071.5,
  );
}
