import * as flags from "../../../../kit/flags.js";
import { RedemptionTemplate } from "./redemption-template.js";

/** One step of the redemption template calculation. */
export interface RedemptionTemplateFactor {
  describe(): string;
  adjust(item: RedemptionTemplate, value: number): number;
}

export class ChannelRedemptionTemplateAdjuster implements RedemptionTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RedemptionTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RedemptionTemplateStartsAtOffsetAdjuster implements RedemptionTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: RedemptionTemplate, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class CapRedemptionTemplateAdjuster implements RedemptionTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRedemptionTemplateAdjuster implements RedemptionTemplateFactor {
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

  adjust(item: RedemptionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRedemptionTemplateAdjuster implements RedemptionTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption template steps in order and keeps a trace of each. */
export class RedemptionTemplateEngine {
  steps: RedemptionTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionTemplate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RedemptionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionTemplateEngine(flagsValue: flags.Registry): RedemptionTemplateEngine {
  return new RedemptionTemplateEngine(
    [
      new ChannelRedemptionTemplateAdjuster(
        new Map<string, number>([["east", 1.24], ["south", 1.1], ["central", 1.15]]),
      ),
      new RedemptionTemplateStartsAtOffsetAdjuster(0.62),
      new CapRedemptionTemplateAdjuster(6243),
      new FlaggedRedemptionTemplateAdjuster(flagsValue, "redemption-template-capped", -8.8),
      new PercentRedemptionTemplateAdjuster(19.6),
    ],
    [],
    3.1,
    47647.2,
  );
}
