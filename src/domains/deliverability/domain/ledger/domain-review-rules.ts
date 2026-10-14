import { DomainReview } from "./domain-review.js";

/** A rule a domain review must pass. Check returns its problems, or none. */
export interface DomainReviewRule {
  check(item: DomainReview): string[];
}

export class DomainReviewRequiredCodeRule implements DomainReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainReviewRequiredCampaignRefRule implements DomainReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainReview): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DomainReviewAmountRangeRule implements DomainReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainReview): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainReviewCodeLengthRule implements DomainReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainReviewRequiredNameRule implements DomainReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain review. */
export class DomainReviewValidator {
  rules: DomainReviewRule[];

  constructor(rules: DomainReviewRule[]) {
    this.rules = rules;
  }

  validate(item: DomainReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainReview[]): Map<string, string[]> {
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

export function defaultDomainReviewValidator(): DomainReviewValidator {
  return new DomainReviewValidator(
    [
      new DomainReviewRequiredCodeRule("domain review needs this field"),
      new DomainReviewRequiredCampaignRefRule("domain review needs an entry"),
      new DomainReviewAmountRangeRule(6.2, 2562.8),
      new DomainReviewCodeLengthRule(120),
      new DomainReviewRequiredNameRule("domain review needs an entry"),
    ],
  );
}
