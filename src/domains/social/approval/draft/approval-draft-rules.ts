import * as text from "../../../../kit/text.js";
import { ApprovalDraft } from "./approval-draft.js";

/** A rule a approval draft must pass. Check returns its problems, or none. */
export interface ApprovalDraftRule {
  check(item: ApprovalDraft): string[];
}

export class ApprovalDraftAllowedTitleRule implements ApprovalDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class ApprovalDraftRequiredTitleRule implements ApprovalDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalDraftGraceDaysRangeRule implements ApprovalDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalDraft): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalDraftCodePrefixRule implements ApprovalDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a approval draft. */
export class ApprovalDraftValidator {
  rules: ApprovalDraftRule[];

  constructor(rules: ApprovalDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalDraft[]): Map<string, string[]> {
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

export function defaultApprovalDraftValidator(): ApprovalDraftValidator {
  return new ApprovalDraftValidator(
    [
      new ApprovalDraftAllowedTitleRule(["rolling", "default", "manual"]),
      new ApprovalDraftRequiredTitleRule("approval draft needs this field"),
      new ApprovalDraftGraceDaysRangeRule(32, 64),
      new ApprovalDraftCodePrefixRule("REF"),
    ],
  );
}
