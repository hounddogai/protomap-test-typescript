import { LenientTicketViewReview } from "./lenient-ticket-view-review.js";

/** A rule a lenient ticket view review must pass. Check returns its problems, or none. */
export interface LenientTicketViewReviewRule {
  check(item: LenientTicketViewReview): string[];
}

export class LenientTicketViewReviewRequiredSourceRule implements LenientTicketViewReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewReview): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTicketViewReviewApprovedGuardRule implements LenientTicketViewReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientTicketViewReview): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientTicketViewReviewPriorityRangeRule implements LenientTicketViewReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTicketViewReview): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient ticket view review. */
export class LenientTicketViewReviewValidator {
  rules: LenientTicketViewReviewRule[];

  constructor(rules: LenientTicketViewReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTicketViewReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTicketViewReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTicketViewReview[]): Map<string, string[]> {
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

export function defaultLenientTicketViewReviewValidator(): LenientTicketViewReviewValidator {
  return new LenientTicketViewReviewValidator(
    [
      new LenientTicketViewReviewRequiredSourceRule("lenient ticket view review needs an entry"),
      new LenientTicketViewReviewApprovedGuardRule(3.8),
      new LenientTicketViewReviewPriorityRangeRule(32, 86400),
    ],
  );
}
