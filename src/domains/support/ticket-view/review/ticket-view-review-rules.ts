import { TicketViewReview } from "./ticket-view-review.js";

/** A rule a ticket view review must pass. Check returns its problems, or none. */
export interface TicketViewReviewRule {
  check(item: TicketViewReview): string[];
}

export class TicketViewReviewPinnedGuardRule implements TicketViewReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewReview): string[] {
    if (item.pinned && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TicketViewReviewRequiredPhoneRule implements TicketViewReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewReview): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewReviewCodeLengthRule implements TicketViewReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewReviewGraceDaysRangeRule implements TicketViewReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewReview): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewReviewCodePrefixRule implements TicketViewReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a ticket view review. */
export class TicketViewReviewValidator {
  rules: TicketViewReviewRule[];

  constructor(rules: TicketViewReviewRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewReview): string[] {
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

  requireValid(item: TicketViewReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewReview[]): Map<string, string[]> {
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

export function defaultTicketViewReviewValidator(): TicketViewReviewValidator {
  return new TicketViewReviewValidator(
    [
      new TicketViewReviewPinnedGuardRule(16),
      new TicketViewReviewRequiredPhoneRule("ticket view review needs this field"),
      new TicketViewReviewCodeLengthRule(80),
      new TicketViewReviewGraceDaysRangeRule(64, 255),
      new TicketViewReviewCodePrefixRule("ACM"),
    ],
  );
}
