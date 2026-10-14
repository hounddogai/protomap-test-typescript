import { ProofReview } from "./proof-review.js";

/** A rule a proof review must pass. Check returns its problems, or none. */
export interface ProofReviewRule {
  check(item: ProofReview): string[];
}

export class ProofReviewSourceLengthRule implements ProofReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofReview): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofReviewRequiredChecksumRule implements ProofReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofReview): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ProofReviewFrequencyCapRangeRule implements ProofReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofReview): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofReviewCodePrefixRule implements ProofReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofReviewCodeLengthRule implements ProofReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofReviewRequiredTitleRule implements ProofReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof review. */
export class ProofReviewValidator {
  rules: ProofReviewRule[];

  constructor(rules: ProofReviewRule[]) {
    this.rules = rules;
  }

  validate(item: ProofReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofReview[]): Map<string, string[]> {
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

export function defaultProofReviewValidator(): ProofReviewValidator {
  return new ProofReviewValidator(
    [
      new ProofReviewSourceLengthRule(64),
      new ProofReviewRequiredChecksumRule("proof review needs a value"),
      new ProofReviewFrequencyCapRangeRule(64, 1000),
      new ProofReviewCodePrefixRule("REF"),
      new ProofReviewCodeLengthRule(120),
      new ProofReviewRequiredTitleRule("proof review needs this field"),
    ],
  );
}
