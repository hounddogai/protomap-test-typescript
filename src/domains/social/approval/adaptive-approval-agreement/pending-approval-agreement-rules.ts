import { PendingApprovalAgreement } from "./pending-approval-agreement.js";

/** A rule a pending approval agreement must pass. Check returns its problems, or none. */
export interface PendingApprovalAgreementRule {
  check(item: PendingApprovalAgreement): string[];
}

export class PendingApprovalAgreementAttemptsRangeRule implements PendingApprovalAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingApprovalAgreement): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingApprovalAgreementExpiresAtRangeRule implements PendingApprovalAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingApprovalAgreement): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingApprovalAgreementRequiredCodeRule implements PendingApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingApprovalAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending approval agreement. */
export class PendingApprovalAgreementValidator {
  rules: PendingApprovalAgreementRule[];

  constructor(rules: PendingApprovalAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PendingApprovalAgreement): string[] {
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

  requireValid(item: PendingApprovalAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingApprovalAgreement[]): Map<string, string[]> {
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

export function defaultPendingApprovalAgreementValidator(): PendingApprovalAgreementValidator {
  return new PendingApprovalAgreementValidator(
    [
      new PendingApprovalAgreementAttemptsRangeRule(64, 1000),
      new PendingApprovalAgreementExpiresAtRangeRule(120, 120),
      new PendingApprovalAgreementRequiredCodeRule("pending approval agreement needs this field"),
    ],
  );
}
