import { LegacySuppressionClaim } from "./legacy-suppression-claim.js";

/** A rule a legacy suppression claim must pass. Check returns its problems, or none. */
export interface LegacySuppressionClaimRule {
  check(item: LegacySuppressionClaim): string[];
}

export class LegacySuppressionClaimRequiredReviewerRule implements LegacySuppressionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySuppressionClaim): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySuppressionClaimRequiredCountryRule implements LegacySuppressionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySuppressionClaim): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySuppressionClaimCodePrefixRule implements LegacySuppressionClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacySuppressionClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacySuppressionClaimNameLengthRule implements LegacySuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySuppressionClaimCountryLengthRule implements LegacySuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionClaim): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySuppressionClaimReviewerLengthRule implements LegacySuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySuppressionClaim): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy suppression claim. */
export class LegacySuppressionClaimValidator {
  rules: LegacySuppressionClaimRule[];

  constructor(rules: LegacySuppressionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySuppressionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySuppressionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySuppressionClaim[]): Map<string, string[]> {
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

export function defaultLegacySuppressionClaimValidator(): LegacySuppressionClaimValidator {
  return new LegacySuppressionClaimValidator(
    [
      new LegacySuppressionClaimRequiredReviewerRule("legacy suppression claim needs an entry"),
      new LegacySuppressionClaimRequiredCountryRule("legacy suppression claim needs this field"),
      new LegacySuppressionClaimCodePrefixRule("REF"),
      new LegacySuppressionClaimNameLengthRule(255),
      new LegacySuppressionClaimCountryLengthRule(255),
      new LegacySuppressionClaimReviewerLengthRule(16),
    ],
  );
}
