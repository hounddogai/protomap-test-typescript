import * as text from "../../../../kit/text.js";
import { BatchedJourneyAgreement } from "./batched-journey-agreement.js";

/** A rule a batched journey agreement must pass. Check returns its problems, or none. */
export interface BatchedJourneyAgreementRule {
  check(item: BatchedJourneyAgreement): string[];
}

export class BatchedJourneyAgreementRequiredNameRule implements BatchedJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedJourneyAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedJourneyAgreementNameLengthRule implements BatchedJourneyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedJourneyAgreementCountryLengthRule implements BatchedJourneyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyAgreement): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedJourneyAgreementAllowedCodeRule implements BatchedJourneyAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedJourneyAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class BatchedJourneyAgreementTimezoneLengthRule implements BatchedJourneyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyAgreement): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched journey agreement. */
export class BatchedJourneyAgreementValidator {
  rules: BatchedJourneyAgreementRule[];

  constructor(rules: BatchedJourneyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedJourneyAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedJourneyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedJourneyAgreement[]): Map<string, string[]> {
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

export function defaultBatchedJourneyAgreementValidator(): BatchedJourneyAgreementValidator {
  return new BatchedJourneyAgreementValidator(
    [
      new BatchedJourneyAgreementRequiredNameRule("batched journey agreement needs an entry"),
      new BatchedJourneyAgreementNameLengthRule(3600),
      new BatchedJourneyAgreementCountryLengthRule(1000),
      new BatchedJourneyAgreementAllowedCodeRule(["weighted"]),
      new BatchedJourneyAgreementTimezoneLengthRule(255),
    ],
  );
}
