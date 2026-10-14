import * as text from "../../../../kit/text.js";
import { ApprovalBaseline } from "./approval-baseline.js";

/** A rule a approval baseline must pass. Check returns its problems, or none. */
export interface ApprovalBaselineRule {
  check(item: ApprovalBaseline): string[];
}

export class ApprovalBaselineNameLengthRule implements ApprovalBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalBaselineRequiredVariantRule implements ApprovalBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalBaseline): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalBaselineCodeLengthRule implements ApprovalBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalBaselineAllowedCodeRule implements ApprovalBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ApprovalBaselineRequiredCodeRule implements ApprovalBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval baseline. */
export class ApprovalBaselineValidator {
  rules: ApprovalBaselineRule[];

  constructor(rules: ApprovalBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalBaseline[]): Map<string, string[]> {
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

export function defaultApprovalBaselineValidator(): ApprovalBaselineValidator {
  return new ApprovalBaselineValidator(
    [
      new ApprovalBaselineNameLengthRule(120),
      new ApprovalBaselineRequiredVariantRule("approval baseline needs this field"),
      new ApprovalBaselineCodeLengthRule(3600),
      new ApprovalBaselineAllowedCodeRule(["legacy", "regional"]),
      new ApprovalBaselineRequiredCodeRule("approval baseline needs an entry"),
    ],
  );
}
