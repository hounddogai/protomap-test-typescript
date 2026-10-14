import { AdaptiveSenderReview } from "./adaptive-sender-review.js";

/** A rule a adaptive sender review must pass. Check returns its problems, or none. */
export interface AdaptiveSenderReviewRule {
  check(item: AdaptiveSenderReview): string[];
}

export class AdaptiveSenderReviewCodePrefixRule implements AdaptiveSenderReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveSenderReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveSenderReviewClicksRangeRule implements AdaptiveSenderReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderReview): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSenderReviewSendAtRangeRule implements AdaptiveSenderReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderReview): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSenderReviewRequiredLabelRule implements AdaptiveSenderReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSenderReview): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive sender review. */
export class AdaptiveSenderReviewValidator {
  rules: AdaptiveSenderReviewRule[];

  constructor(rules: AdaptiveSenderReviewRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSenderReview): string[] {
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

  requireValid(item: AdaptiveSenderReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSenderReview[]): Map<string, string[]> {
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

export function defaultAdaptiveSenderReviewValidator(): AdaptiveSenderReviewValidator {
  return new AdaptiveSenderReviewValidator(
    [
      new AdaptiveSenderReviewCodePrefixRule("X"),
      new AdaptiveSenderReviewClicksRangeRule(16, 3600),
      new AdaptiveSenderReviewSendAtRangeRule(3600, 86400),
      new AdaptiveSenderReviewRequiredLabelRule("adaptive sender review needs this field"),
    ],
  );
}
