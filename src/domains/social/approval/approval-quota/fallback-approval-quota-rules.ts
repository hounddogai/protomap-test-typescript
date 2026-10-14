import { FallbackApprovalQuota } from "./fallback-approval-quota.js";

/** A rule a fallback approval quota must pass. Check returns its problems, or none. */
export interface FallbackApprovalQuotaRule {
  check(item: FallbackApprovalQuota): string[];
}

export class FallbackApprovalQuotaRequiredCodeRule implements FallbackApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalQuotaRequiredLabelRule implements FallbackApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalQuotaRequiredSummaryRule implements FallbackApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalQuotaNameLengthRule implements FallbackApprovalQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackApprovalQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackApprovalQuotaRequiredNameRule implements FallbackApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalQuotaCodeLengthRule implements FallbackApprovalQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackApprovalQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback approval quota. */
export class FallbackApprovalQuotaValidator {
  rules: FallbackApprovalQuotaRule[];

  constructor(rules: FallbackApprovalQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackApprovalQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackApprovalQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackApprovalQuota[]): Map<string, string[]> {
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

export function defaultFallbackApprovalQuotaValidator(): FallbackApprovalQuotaValidator {
  return new FallbackApprovalQuotaValidator(
    [
      new FallbackApprovalQuotaRequiredCodeRule("fallback approval quota needs this field"),
      new FallbackApprovalQuotaRequiredLabelRule("fallback approval quota needs an entry"),
      new FallbackApprovalQuotaRequiredSummaryRule("fallback approval quota needs a value"),
      new FallbackApprovalQuotaNameLengthRule(32),
      new FallbackApprovalQuotaRequiredNameRule("fallback approval quota needs a value"),
      new FallbackApprovalQuotaCodeLengthRule(1000),
    ],
  );
}
