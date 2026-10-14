import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingRetentionTemplate } from "./rolling-retention-template.js";

/** One step of the rolling retention template calculation. */
export interface RollingRetentionTemplateModifier {
  describe(): string;
  adjust(item: RollingRetentionTemplate, value: number): number;
}

export class FlaggedRollingRetentionTemplateAdjuster implements RollingRetentionTemplateModifier {
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

  adjust(item: RollingRetentionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingRetentionTemplateAdjuster implements RollingRetentionTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingRetentionTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentRollingRetentionTemplateAdjuster implements RollingRetentionTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RollingRetentionTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling retention template steps in order and keeps a trace of each. */
export class RollingRetentionTemplateEngine {
  steps: RollingRetentionTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRetentionTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingRetentionTemplate): number {
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

  evaluateAll(items: RollingRetentionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingRetentionTemplateEngine(flagsValue: flags.Registry): RollingRetentionTemplateEngine {
  return new RollingRetentionTemplateEngine(
    [
      new FlaggedRollingRetentionTemplateAdjuster(flagsValue, "rolling-retention-template-pending", 4.6),
      new RoundingRollingRetentionTemplateAdjuster(1),
      new SegmentRollingRetentionTemplateAdjuster(
        new Map<string, number>([["east", 1.25], ["south", 1.11], ["north", 1.03]]),
      ),
    ],
    [],
    0.2,
    92166.6,
  );
}
