import * as text from "../../../../kit/text.js";
import { GlobalApprovalAudit } from "./global-approval-audit.js";

/** A rule a global approval audit must pass. Check returns its problems, or none. */
export interface GlobalApprovalAuditRule {
  check(item: GlobalApprovalAudit): string[];
}

export class GlobalApprovalAuditUpdatedAtRangeRule implements GlobalApprovalAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalApprovalAudit): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalApprovalAuditAllowedCodeRule implements GlobalApprovalAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalApprovalAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class GlobalApprovalAuditCodePrefixRule implements GlobalApprovalAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalApprovalAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalApprovalAuditCodeLengthRule implements GlobalApprovalAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalApprovalAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalApprovalAuditBudgetRangeRule implements GlobalApprovalAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalApprovalAudit): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalApprovalAuditRequiredNameRule implements GlobalApprovalAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalApprovalAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global approval audit. */
export class GlobalApprovalAuditValidator {
  rules: GlobalApprovalAuditRule[];

  constructor(rules: GlobalApprovalAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalApprovalAudit): string[] {
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

  requireValid(item: GlobalApprovalAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalApprovalAudit[]): Map<string, string[]> {
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

export function defaultGlobalApprovalAuditValidator(): GlobalApprovalAuditValidator {
  return new GlobalApprovalAuditValidator(
    [
      new GlobalApprovalAuditUpdatedAtRangeRule(80, 1000),
      new GlobalApprovalAuditAllowedCodeRule(["legacy"]),
      new GlobalApprovalAuditCodePrefixRule("REF"),
      new GlobalApprovalAuditCodeLengthRule(120),
      new GlobalApprovalAuditBudgetRangeRule(6.9, 3278.5),
      new GlobalApprovalAuditRequiredNameRule("global approval audit needs an entry"),
    ],
  );
}
