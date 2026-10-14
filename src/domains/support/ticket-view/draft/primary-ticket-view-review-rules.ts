import { PrimaryTicketViewReview } from "./primary-ticket-view-review.js";

/** A rule a primary ticket view review must pass. Check returns its problems, or none. */
export interface PrimaryTicketViewReviewRule {
  check(item: PrimaryTicketViewReview): string[];
}

export class PrimaryTicketViewReviewRequiredExternalRefRule implements PrimaryTicketViewReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewReview): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTicketViewReviewWindowDaysRangeRule implements PrimaryTicketViewReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTicketViewReview): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryTicketViewReviewFloorValueRangeRule implements PrimaryTicketViewReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTicketViewReview): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary ticket view review. */
export class PrimaryTicketViewReviewValidator {
  rules: PrimaryTicketViewReviewRule[];

  constructor(rules: PrimaryTicketViewReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTicketViewReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTicketViewReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTicketViewReview[]): Map<string, string[]> {
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

export function defaultPrimaryTicketViewReviewValidator(): PrimaryTicketViewReviewValidator {
  return new PrimaryTicketViewReviewValidator(
    [
      new PrimaryTicketViewReviewRequiredExternalRefRule("primary ticket view review needs this field"),
      new PrimaryTicketViewReviewWindowDaysRangeRule(16, 80),
      new PrimaryTicketViewReviewFloorValueRangeRule(8.1, 1582.4),
    ],
  );
}
