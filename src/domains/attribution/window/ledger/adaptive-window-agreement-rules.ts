import { AdaptiveWindowAgreement } from "./adaptive-window-agreement.js";

/** A rule a adaptive window agreement must pass. Check returns its problems, or none. */
export interface AdaptiveWindowAgreementRule {
  check(item: AdaptiveWindowAgreement): string[];
}

export class AdaptiveWindowAgreementCategoryLengthRule implements AdaptiveWindowAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWindowAgreementRequiredNameRule implements AdaptiveWindowAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWindowAgreementRequiredCodeRule implements AdaptiveWindowAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWindowAgreementActiveGuardRule implements AdaptiveWindowAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    if (item.active && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class AdaptiveWindowAgreementRequiredSummaryRule implements AdaptiveWindowAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWindowAgreementNameLengthRule implements AdaptiveWindowAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWindowAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive window agreement. */
export class AdaptiveWindowAgreementValidator {
  rules: AdaptiveWindowAgreementRule[];

  constructor(rules: AdaptiveWindowAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWindowAgreement): string[] {
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

  requireValid(item: AdaptiveWindowAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWindowAgreement[]): Map<string, string[]> {
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

export function defaultAdaptiveWindowAgreementValidator(): AdaptiveWindowAgreementValidator {
  return new AdaptiveWindowAgreementValidator(
    [
      new AdaptiveWindowAgreementCategoryLengthRule(86400),
      new AdaptiveWindowAgreementRequiredNameRule("adaptive window agreement needs an entry"),
      new AdaptiveWindowAgreementRequiredCodeRule("adaptive window agreement needs an entry"),
      new AdaptiveWindowAgreementActiveGuardRule(6.7),
      new AdaptiveWindowAgreementRequiredSummaryRule("adaptive window agreement needs this field"),
      new AdaptiveWindowAgreementNameLengthRule(86400),
    ],
  );
}
