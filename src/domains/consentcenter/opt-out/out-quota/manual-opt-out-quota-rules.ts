import * as text from "../../../../kit/text.js";
import { ManualOptOutQuota } from "./manual-opt-out-quota.js";

/** A rule a manual opt out quota must pass. Check returns its problems, or none. */
export interface ManualOptOutQuotaRule {
  check(item: ManualOptOutQuota): string[];
}

export class ManualOptOutQuotaAllowedCodeRule implements ManualOptOutQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualOptOutQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ManualOptOutQuotaRequiredCodeRule implements ManualOptOutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualOptOutQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualOptOutQuotaLabelLengthRule implements ManualOptOutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualOptOutQuotaCodeLengthRule implements ManualOptOutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual opt out quota. */
export class ManualOptOutQuotaValidator {
  rules: ManualOptOutQuotaRule[];

  constructor(rules: ManualOptOutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualOptOutQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualOptOutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualOptOutQuota[]): Map<string, string[]> {
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

export function defaultManualOptOutQuotaValidator(): ManualOptOutQuotaValidator {
  return new ManualOptOutQuotaValidator(
    [
      new ManualOptOutQuotaAllowedCodeRule(["default"]),
      new ManualOptOutQuotaRequiredCodeRule("manual opt out quota needs a value"),
      new ManualOptOutQuotaLabelLengthRule(16),
      new ManualOptOutQuotaCodeLengthRule(80),
    ],
  );
}
