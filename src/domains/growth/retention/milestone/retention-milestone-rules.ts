import * as text from "../../../../kit/text.js";
import { RetentionMilestone } from "./retention-milestone.js";

/** A rule a retention milestone must pass. Check returns its problems, or none. */
export interface RetentionMilestoneRule {
  check(item: RetentionMilestone): string[];
}

export class RetentionMilestoneRequiredLabelRule implements RetentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionMilestoneLabelLengthRule implements RetentionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionMilestoneAllowedCurrencyRule implements RetentionMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class RetentionMilestoneRequiredPhoneRule implements RetentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMilestone): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionMilestoneRequiredCodeRule implements RetentionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention milestone. */
export class RetentionMilestoneValidator {
  rules: RetentionMilestoneRule[];

  constructor(rules: RetentionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionMilestone): string[] {
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

  requireValid(item: RetentionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionMilestone[]): Map<string, string[]> {
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

export function defaultRetentionMilestoneValidator(): RetentionMilestoneValidator {
  return new RetentionMilestoneValidator(
    [
      new RetentionMilestoneRequiredLabelRule("retention milestone needs an entry"),
      new RetentionMilestoneLabelLengthRule(86400),
      new RetentionMilestoneAllowedCurrencyRule(["batched", "global", "manual"]),
      new RetentionMilestoneRequiredPhoneRule("retention milestone needs this field"),
      new RetentionMilestoneRequiredCodeRule("retention milestone needs a value"),
    ],
  );
}
