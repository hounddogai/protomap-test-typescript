import { PendingApprovalAudit } from "./pending-approval-audit.js";

/** A rule a pending approval audit must pass. Check returns its problems, or none. */
export interface PendingApprovalAuditRule {
  check(item: PendingApprovalAudit): string[];
}

export class PendingApprovalAuditPinnedGuardRule implements PendingApprovalAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingApprovalAudit): string[] {
    if (item.pinned && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PendingApprovalAuditRequiredChannelRule implements PendingApprovalAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingApprovalAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PendingApprovalAuditTitleLengthRule implements PendingApprovalAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalAuditChannelLengthRule implements PendingApprovalAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalAuditRequiredCodeRule implements PendingApprovalAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingApprovalAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingApprovalAuditCodePrefixRule implements PendingApprovalAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingApprovalAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending approval audit. */
export class PendingApprovalAuditValidator {
  rules: PendingApprovalAuditRule[];

  constructor(rules: PendingApprovalAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingApprovalAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingApprovalAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingApprovalAudit[]): Map<string, string[]> {
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

export function defaultPendingApprovalAuditValidator(): PendingApprovalAuditValidator {
  return new PendingApprovalAuditValidator(
    [
      new PendingApprovalAuditPinnedGuardRule(86400),
      new PendingApprovalAuditRequiredChannelRule("pending approval audit needs this field"),
      new PendingApprovalAuditTitleLengthRule(120),
      new PendingApprovalAuditChannelLengthRule(16),
      new PendingApprovalAuditRequiredCodeRule("pending approval audit needs a value"),
      new PendingApprovalAuditCodePrefixRule("REF"),
    ],
  );
}
