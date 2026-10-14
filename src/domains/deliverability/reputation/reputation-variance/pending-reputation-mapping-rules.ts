import { PendingReputationMapping } from "./pending-reputation-mapping.js";

/** A rule a pending reputation mapping must pass. Check returns its problems, or none. */
export interface PendingReputationMappingRule {
  check(item: PendingReputationMapping): string[];
}

export class PendingReputationMappingTitleLengthRule implements PendingReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingReputationMappingRequiredReviewerRule implements PendingReputationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReputationMapping): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReputationMappingReviewerLengthRule implements PendingReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationMapping): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reputation mapping. */
export class PendingReputationMappingValidator {
  rules: PendingReputationMappingRule[];

  constructor(rules: PendingReputationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReputationMapping): string[] {
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

  requireValid(item: PendingReputationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReputationMapping[]): Map<string, string[]> {
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

export function defaultPendingReputationMappingValidator(): PendingReputationMappingValidator {
  return new PendingReputationMappingValidator(
    [
      new PendingReputationMappingTitleLengthRule(86400),
      new PendingReputationMappingRequiredReviewerRule("pending reputation mapping needs this field"),
      new PendingReputationMappingReviewerLengthRule(1000),
    ],
  );
}
