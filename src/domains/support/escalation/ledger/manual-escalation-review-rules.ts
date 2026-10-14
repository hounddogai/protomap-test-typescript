import { ManualEscalationReview } from "./manual-escalation-review.js";

/** A rule a manual escalation review must pass. Check returns its problems, or none. */
export interface ManualEscalationReviewRule {
  check(item: ManualEscalationReview): string[];
}

export class ManualEscalationReviewRequiredCountryRule implements ManualEscalationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationReview): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEscalationReviewRequiredCodeRule implements ManualEscalationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEscalationReviewTitleLengthRule implements ManualEscalationReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEscalationReview): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEscalationReviewRequiredTitleRule implements ManualEscalationReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEscalationReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual escalation review. */
export class ManualEscalationReviewValidator {
  rules: ManualEscalationReviewRule[];

  constructor(rules: ManualEscalationReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEscalationReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualEscalationReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEscalationReview[]): Map<string, string[]> {
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

export function defaultManualEscalationReviewValidator(): ManualEscalationReviewValidator {
  return new ManualEscalationReviewValidator(
    [
      new ManualEscalationReviewRequiredCountryRule("manual escalation review needs an entry"),
      new ManualEscalationReviewRequiredCodeRule("manual escalation review needs a value"),
      new ManualEscalationReviewTitleLengthRule(86400),
      new ManualEscalationReviewRequiredTitleRule("manual escalation review needs this field"),
    ],
  );
}
