import { PendingLevelQuota } from "./pending-level-quota.js";

/** A rule a pending level quota must pass. Check returns its problems, or none. */
export interface PendingLevelQuotaRule {
  check(item: PendingLevelQuota): string[];
}

export class PendingLevelQuotaRequiredSummaryRule implements PendingLevelQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelQuotaSummaryLengthRule implements PendingLevelQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelQuota): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelQuotaCodeLengthRule implements PendingLevelQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelQuotaRequiredLabelRule implements PendingLevelQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending level quota. */
export class PendingLevelQuotaValidator {
  rules: PendingLevelQuotaRule[];

  constructor(rules: PendingLevelQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingLevelQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelQuota[]): Map<string, string[]> {
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

export function defaultPendingLevelQuotaValidator(): PendingLevelQuotaValidator {
  return new PendingLevelQuotaValidator(
    [
      new PendingLevelQuotaRequiredSummaryRule("pending level quota needs an entry"),
      new PendingLevelQuotaSummaryLengthRule(16),
      new PendingLevelQuotaCodeLengthRule(80),
      new PendingLevelQuotaRequiredLabelRule("pending level quota needs this field"),
    ],
  );
}
