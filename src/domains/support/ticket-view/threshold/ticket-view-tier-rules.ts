import * as text from "../../../../kit/text.js";
import { TicketViewTier } from "./ticket-view-tier.js";

/** A rule a ticket view tier must pass. Check returns its problems, or none. */
export interface TicketViewTierRule {
  check(item: TicketViewTier): string[];
}

export class TicketViewTierPhoneLengthRule implements TicketViewTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewTier): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewTierCodePrefixRule implements TicketViewTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewTierRequiredCategoryRule implements TicketViewTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTier): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewTierAllowedTitleRule implements TicketViewTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class TicketViewTierRatioRangeRule implements TicketViewTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewTier): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewTierRequiredTitleRule implements TicketViewTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view tier. */
export class TicketViewTierValidator {
  rules: TicketViewTierRule[];

  constructor(rules: TicketViewTierRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewTier[]): Map<string, string[]> {
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

export function defaultTicketViewTierValidator(): TicketViewTierValidator {
  return new TicketViewTierValidator(
    [
      new TicketViewTierPhoneLengthRule(120),
      new TicketViewTierCodePrefixRule("X"),
      new TicketViewTierRequiredCategoryRule("ticket view tier needs an entry"),
      new TicketViewTierAllowedTitleRule(["fallback", "default", "seasonal"]),
      new TicketViewTierRatioRangeRule(0.5, 1168.8),
      new TicketViewTierRequiredTitleRule("ticket view tier needs a value"),
    ],
  );
}
