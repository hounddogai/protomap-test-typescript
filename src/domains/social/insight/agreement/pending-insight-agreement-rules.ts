import { PendingInsightAgreement } from "./pending-insight-agreement.js";

/** A rule a pending insight agreement must pass. Check returns its problems, or none. */
export interface PendingInsightAgreementRule {
  check(item: PendingInsightAgreement): string[];
}

export class PendingInsightAgreementRequiredVariantRule implements PendingInsightAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightAgreement): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInsightAgreementVariantLengthRule implements PendingInsightAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInsightAgreement): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInsightAgreementRequiredCountryRule implements PendingInsightAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightAgreement): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInsightAgreementCountryLengthRule implements PendingInsightAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInsightAgreement): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInsightAgreementRequiredTitleRule implements PendingInsightAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending insight agreement. */
export class PendingInsightAgreementValidator {
  rules: PendingInsightAgreementRule[];

  constructor(rules: PendingInsightAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInsightAgreement): string[] {
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

  requireValid(item: PendingInsightAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInsightAgreement[]): Map<string, string[]> {
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

export function defaultPendingInsightAgreementValidator(): PendingInsightAgreementValidator {
  return new PendingInsightAgreementValidator(
    [
      new PendingInsightAgreementRequiredVariantRule("pending insight agreement needs an entry"),
      new PendingInsightAgreementVariantLengthRule(120),
      new PendingInsightAgreementRequiredCountryRule("pending insight agreement needs an entry"),
      new PendingInsightAgreementCountryLengthRule(3600),
      new PendingInsightAgreementRequiredTitleRule("pending insight agreement needs an entry"),
    ],
  );
}
