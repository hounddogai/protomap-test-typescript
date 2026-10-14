import * as text from "../../../../kit/text.js";
import { ApprovalOverride } from "./approval-override.js";

/** A rule a approval override must pass. Check returns its problems, or none. */
export interface ApprovalOverrideRule {
  check(item: ApprovalOverride): string[];
}

export class ApprovalOverrideRequiredTitleRule implements ApprovalOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalOverrideAllowedCodeRule implements ApprovalOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class ApprovalOverrideSendAtRangeRule implements ApprovalOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalOverride): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval override. */
export class ApprovalOverrideValidator {
  rules: ApprovalOverrideRule[];

  constructor(rules: ApprovalOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalOverride): string[] {
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

  requireValid(item: ApprovalOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalOverride[]): Map<string, string[]> {
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

export function defaultApprovalOverrideValidator(): ApprovalOverrideValidator {
  return new ApprovalOverrideValidator(
    [
      new ApprovalOverrideRequiredTitleRule("approval override needs a value"),
      new ApprovalOverrideAllowedCodeRule(["scheduled", "seasonal"]),
      new ApprovalOverrideSendAtRangeRule(32, 3600),
    ],
  );
}
