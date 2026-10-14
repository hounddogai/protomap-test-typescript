import { SenderAudit } from "./sender-audit.js";

/** A rule a sender audit must pass. Check returns its problems, or none. */
export interface SenderAuditRule {
  check(item: SenderAudit): string[];
}

export class SenderAuditRequiredReviewerRule implements SenderAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderAudit): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class SenderAuditRequiredCodeRule implements SenderAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderAuditNameLengthRule implements SenderAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderAuditSegmentLengthRule implements SenderAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderAudit): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderAuditRequiredSegmentRule implements SenderAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SenderAuditCodePrefixRule implements SenderAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sender audit. */
export class SenderAuditValidator {
  rules: SenderAuditRule[];

  constructor(rules: SenderAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SenderAudit): string[] {
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

  requireValid(item: SenderAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderAudit[]): Map<string, string[]> {
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

export function defaultSenderAuditValidator(): SenderAuditValidator {
  return new SenderAuditValidator(
    [
      new SenderAuditRequiredReviewerRule("sender audit needs this field"),
      new SenderAuditRequiredCodeRule("sender audit needs this field"),
      new SenderAuditNameLengthRule(80),
      new SenderAuditSegmentLengthRule(120),
      new SenderAuditRequiredSegmentRule("sender audit needs this field"),
      new SenderAuditCodePrefixRule("X"),
    ],
  );
}
