import * as text from "../../../../kit/text.js";
import { RegionalStepAudit } from "./regional-step-audit.js";

/** A rule a regional step audit must pass. Check returns its problems, or none. */
export interface RegionalStepAuditRule {
  check(item: RegionalStepAudit): string[];
}

export class RegionalStepAuditRequiredCodeRule implements RegionalStepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStepAuditAllowedExternalRefRule implements RegionalStepAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalStepAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is missing`];
    return [];
  }
}

export class RegionalStepAuditCodeLengthRule implements RegionalStepAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStepAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional step audit. */
export class RegionalStepAuditValidator {
  rules: RegionalStepAuditRule[];

  constructor(rules: RegionalStepAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStepAudit): string[] {
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

  requireValid(item: RegionalStepAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStepAudit[]): Map<string, string[]> {
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

export function defaultRegionalStepAuditValidator(): RegionalStepAuditValidator {
  return new RegionalStepAuditValidator(
    [
      new RegionalStepAuditRequiredCodeRule("regional step audit needs this field"),
      new RegionalStepAuditAllowedExternalRefRule(["adaptive"]),
      new RegionalStepAuditCodeLengthRule(120),
    ],
  );
}
