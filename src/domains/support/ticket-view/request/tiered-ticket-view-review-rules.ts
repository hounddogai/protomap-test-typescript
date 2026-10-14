import { TieredTicketViewReview } from "./tiered-ticket-view-review.js";

/** A rule a tiered ticket view review must pass. Check returns its problems, or none. */
export interface TieredTicketViewReviewRule {
  check(item: TieredTicketViewReview): string[];
}

export class TieredTicketViewReviewCurrencyLengthRule implements TieredTicketViewReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewReview): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTicketViewReviewCodePrefixRule implements TieredTicketViewReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredTicketViewReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredTicketViewReviewRequiredLabelRule implements TieredTicketViewReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewReviewRevisionRangeRule implements TieredTicketViewReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTicketViewReview): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredTicketViewReviewRequiredCurrencyRule implements TieredTicketViewReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewReview): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered ticket view review. */
export class TieredTicketViewReviewValidator {
  rules: TieredTicketViewReviewRule[];

  constructor(rules: TieredTicketViewReviewRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTicketViewReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: TieredTicketViewReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTicketViewReview[]): Map<string, string[]> {
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

export function defaultTieredTicketViewReviewValidator(): TieredTicketViewReviewValidator {
  return new TieredTicketViewReviewValidator(
    [
      new TieredTicketViewReviewCurrencyLengthRule(80),
      new TieredTicketViewReviewCodePrefixRule("X"),
      new TieredTicketViewReviewRequiredLabelRule("tiered ticket view review needs this field"),
      new TieredTicketViewReviewRevisionRangeRule(16, 86400),
      new TieredTicketViewReviewRequiredCurrencyRule("tiered ticket view review needs this field"),
    ],
  );
}
