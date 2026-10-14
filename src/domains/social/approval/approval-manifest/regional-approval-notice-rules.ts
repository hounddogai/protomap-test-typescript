import { RegionalApprovalNotice } from "./regional-approval-notice.js";

/** A rule a regional approval notice must pass. Check returns its problems, or none. */
export interface RegionalApprovalNoticeRule {
  check(item: RegionalApprovalNotice): string[];
}

export class RegionalApprovalNoticeRequiredCodeRule implements RegionalApprovalNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalNoticeCodePrefixRule implements RegionalApprovalNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalApprovalNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalApprovalNoticeLabelLengthRule implements RegionalApprovalNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalApprovalNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalApprovalNoticeApprovedGuardRule implements RegionalApprovalNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalApprovalNotice): string[] {
    if (item.approved && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a regional approval notice. */
export class RegionalApprovalNoticeValidator {
  rules: RegionalApprovalNoticeRule[];

  constructor(rules: RegionalApprovalNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalApprovalNotice): string[] {
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

  requireValid(item: RegionalApprovalNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalApprovalNotice[]): Map<string, string[]> {
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

export function defaultRegionalApprovalNoticeValidator(): RegionalApprovalNoticeValidator {
  return new RegionalApprovalNoticeValidator(
    [
      new RegionalApprovalNoticeRequiredCodeRule("regional approval notice needs this field"),
      new RegionalApprovalNoticeCodePrefixRule("X"),
      new RegionalApprovalNoticeLabelLengthRule(64),
      new RegionalApprovalNoticeApprovedGuardRule(32),
    ],
  );
}
