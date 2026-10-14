import { AdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

/** A rule a adaptive approval agreement must pass. Check returns its problems, or none. */
export interface AdaptiveApprovalAgreementRule {
  check(item: AdaptiveApprovalAgreement): string[];
}

export class AdaptiveApprovalAgreementCountryLengthRule implements AdaptiveApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveApprovalAgreement): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveApprovalAgreementRequiredCodeRule implements AdaptiveApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveApprovalAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveApprovalAgreementScoreRangeRule implements AdaptiveApprovalAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveApprovalAgreement): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveApprovalAgreementVisibleGuardRule implements AdaptiveApprovalAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveApprovalAgreement): string[] {
    if (item.visible && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class AdaptiveApprovalAgreementRequiredUnitRule implements AdaptiveApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveApprovalAgreement): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive approval agreement. */
export class AdaptiveApprovalAgreementValidator {
  rules: AdaptiveApprovalAgreementRule[];

  constructor(rules: AdaptiveApprovalAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveApprovalAgreement): string[] {
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

  requireValid(item: AdaptiveApprovalAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveApprovalAgreement[]): Map<string, string[]> {
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

export function defaultAdaptiveApprovalAgreementValidator(): AdaptiveApprovalAgreementValidator {
  return new AdaptiveApprovalAgreementValidator(
    [
      new AdaptiveApprovalAgreementCountryLengthRule(80),
      new AdaptiveApprovalAgreementRequiredCodeRule("adaptive approval agreement needs an entry"),
      new AdaptiveApprovalAgreementScoreRangeRule(3.7, 3807.6),
      new AdaptiveApprovalAgreementVisibleGuardRule(1000),
      new AdaptiveApprovalAgreementRequiredUnitRule("adaptive approval agreement needs a value"),
    ],
  );
}
