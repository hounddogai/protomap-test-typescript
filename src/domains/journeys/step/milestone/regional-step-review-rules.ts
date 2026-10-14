import * as text from "../../../../kit/text.js";
import { RegionalStepReview } from "./regional-step-review.js";

/** A rule a regional step review must pass. Check returns its problems, or none. */
export interface RegionalStepReviewRule {
  check(item: RegionalStepReview): string[];
}

export class RegionalStepReviewAllowedNameRule implements RegionalStepReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalStepReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class RegionalStepReviewOwnerIdLengthRule implements RegionalStepReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStepReview): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalStepReviewRequiredOwnerIdRule implements RegionalStepReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepReview): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStepReviewRequiredCodeRule implements RegionalStepReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStepReviewPinnedGuardRule implements RegionalStepReviewRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalStepReview): string[] {
    if (item.pinned && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RegionalStepReviewSourceLengthRule implements RegionalStepReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStepReview): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional step review. */
export class RegionalStepReviewValidator {
  rules: RegionalStepReviewRule[];

  constructor(rules: RegionalStepReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStepReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalStepReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStepReview[]): Map<string, string[]> {
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

export function defaultRegionalStepReviewValidator(): RegionalStepReviewValidator {
  return new RegionalStepReviewValidator(
    [
      new RegionalStepReviewAllowedNameRule(["adaptive"]),
      new RegionalStepReviewOwnerIdLengthRule(3600),
      new RegionalStepReviewRequiredOwnerIdRule("regional step review needs an entry"),
      new RegionalStepReviewRequiredCodeRule("regional step review needs an entry"),
      new RegionalStepReviewPinnedGuardRule(255),
      new RegionalStepReviewSourceLengthRule(80),
    ],
  );
}
