import * as text from "../../../../kit/text.js";
import { ApprovalRollup } from "./approval-rollup.js";

/** A rule a approval rollup must pass. Check returns its problems, or none. */
export interface ApprovalRollupRule {
  check(item: ApprovalRollup): string[];
}

export class ApprovalRollupVersionRangeRule implements ApprovalRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalRollup): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalRollupRequiredCodeRule implements ApprovalRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalRollupLabelLengthRule implements ApprovalRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalRollupAllowedLabelRule implements ApprovalRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class ApprovalRollupVisibleGuardRule implements ApprovalRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ApprovalRollup): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a approval rollup. */
export class ApprovalRollupValidator {
  rules: ApprovalRollupRule[];

  constructor(rules: ApprovalRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalRollup[]): Map<string, string[]> {
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

export function defaultApprovalRollupValidator(): ApprovalRollupValidator {
  return new ApprovalRollupValidator(
    [
      new ApprovalRollupVersionRangeRule(120, 1000),
      new ApprovalRollupRequiredCodeRule("approval rollup needs a value"),
      new ApprovalRollupLabelLengthRule(80),
      new ApprovalRollupAllowedLabelRule(["adaptive", "fallback"]),
      new ApprovalRollupVisibleGuardRule(3.5),
    ],
  );
}
