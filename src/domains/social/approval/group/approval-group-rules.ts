import * as text from "../../../../kit/text.js";
import { ApprovalGroup } from "./approval-group.js";

/** A rule a approval group must pass. Check returns its problems, or none. */
export interface ApprovalGroupRule {
  check(item: ApprovalGroup): string[];
}

export class ApprovalGroupCodePrefixRule implements ApprovalGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalGroupRequiredVariantRule implements ApprovalGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalGroup): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalGroupVariantLengthRule implements ApprovalGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalGroup): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalGroupAllowedTitleRule implements ApprovalGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

/** Runs every rule of a approval group. */
export class ApprovalGroupValidator {
  rules: ApprovalGroupRule[];

  constructor(rules: ApprovalGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalGroup): string[] {
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

  requireValid(item: ApprovalGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalGroup[]): Map<string, string[]> {
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

export function defaultApprovalGroupValidator(): ApprovalGroupValidator {
  return new ApprovalGroupValidator(
    [
      new ApprovalGroupCodePrefixRule("Q"),
      new ApprovalGroupRequiredVariantRule("approval group needs a value"),
      new ApprovalGroupVariantLengthRule(120),
      new ApprovalGroupAllowedTitleRule(["weighted", "capped", "capped"]),
    ],
  );
}
