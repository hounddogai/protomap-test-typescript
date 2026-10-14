import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionTemplate } from "./mention-template.js";

/** One step of the mention template calculation. */
export interface MentionTemplateModifier {
  describe(): string;
  adjust(item: MentionTemplate, value: number): number;
}

export class RoundingMentionTemplateAdjuster implements MentionTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumMentionTemplateAdjuster implements MentionTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedMentionTemplateAdjuster implements MentionTemplateModifier {
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

  adjust(item: MentionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMentionTemplateAdjuster implements MentionTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MentionTemplateExpiresAtOffsetAdjuster implements MentionTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: MentionTemplate, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the mention template steps in order and keeps a trace of each. */
export class MentionTemplateEngine {
  steps: MentionTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionTemplate): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: MentionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionTemplateEngine(flagsValue: flags.Registry): MentionTemplateEngine {
  return new MentionTemplateEngine(
    [
      new RoundingMentionTemplateAdjuster(0.25),
      new MinimumMentionTemplateAdjuster(11.5),
      new FlaggedMentionTemplateAdjuster(flagsValue, "mention-template-primary", 0.2),
      new PercentMentionTemplateAdjuster(17.6),
      new MentionTemplateExpiresAtOffsetAdjuster(1.06),
    ],
    [],
    0.6,
    83901.4,
  );
}
