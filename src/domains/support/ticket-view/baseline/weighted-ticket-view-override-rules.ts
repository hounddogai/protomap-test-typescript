import * as text from "../../../../kit/text.js";
import { WeightedTicketViewOverride } from "./weighted-ticket-view-override.js";

/** A rule a weighted ticket view override must pass. Check returns its problems, or none. */
export interface WeightedTicketViewOverrideRule {
  check(item: WeightedTicketViewOverride): string[];
}

export class WeightedTicketViewOverrideClicksRangeRule implements WeightedTicketViewOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTicketViewOverride): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedTicketViewOverrideWindowDaysRangeRule implements WeightedTicketViewOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTicketViewOverride): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedTicketViewOverrideAllowedTimezoneRule implements WeightedTicketViewOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedTicketViewOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is above maximum`];
    return [];
  }
}

export class WeightedTicketViewOverrideRequiredLabelRule implements WeightedTicketViewOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTicketViewOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTicketViewOverrideCodeLengthRule implements WeightedTicketViewOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTicketViewOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTicketViewOverrideRequiredChannelRule implements WeightedTicketViewOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTicketViewOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted ticket view override. */
export class WeightedTicketViewOverrideValidator {
  rules: WeightedTicketViewOverrideRule[];

  constructor(rules: WeightedTicketViewOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTicketViewOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTicketViewOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTicketViewOverride[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultWeightedTicketViewOverrideValidator(): WeightedTicketViewOverrideValidator {
  return new WeightedTicketViewOverrideValidator(
    [
      new WeightedTicketViewOverrideClicksRangeRule(32, 86400),
      new WeightedTicketViewOverrideWindowDaysRangeRule(80, 3600),
      new WeightedTicketViewOverrideAllowedTimezoneRule(["weighted", "lenient"]),
      new WeightedTicketViewOverrideRequiredLabelRule("weighted ticket view override needs this field"),
      new WeightedTicketViewOverrideCodeLengthRule(64),
      new WeightedTicketViewOverrideRequiredChannelRule("weighted ticket view override needs an entry"),
    ],
  );
}
