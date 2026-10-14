import * as text from "../../../../kit/text.js";
import { LenientSlaReview } from "./lenient-sla-review.js";

/** A rule a lenient sla review must pass. Check returns its problems, or none. */
export interface LenientSlaReviewRule {
  check(item: LenientSlaReview): string[];
}

export class LenientSlaReviewRequiredTitleRule implements LenientSlaReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaReviewAllowedCodeRule implements LenientSlaReviewRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientSlaReview): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class LenientSlaReviewChecksumLengthRule implements LenientSlaReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaReview): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaReviewCodeLengthRule implements LenientSlaReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaReviewRequiredChecksumRule implements LenientSlaReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient sla review. */
export class LenientSlaReviewValidator {
  rules: LenientSlaReviewRule[];

  constructor(rules: LenientSlaReviewRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSlaReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSlaReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSlaReview[]): Map<string, string[]> {
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

export function defaultLenientSlaReviewValidator(): LenientSlaReviewValidator {
  return new LenientSlaReviewValidator(
    [
      new LenientSlaReviewRequiredTitleRule("lenient sla review needs this field"),
      new LenientSlaReviewAllowedCodeRule(["seasonal"]),
      new LenientSlaReviewChecksumLengthRule(3600),
      new LenientSlaReviewCodeLengthRule(80),
      new LenientSlaReviewRequiredChecksumRule("lenient sla review needs a value"),
    ],
  );
}
