import { ApprovalAdjustment } from "./approval-adjustment.js";

/** A rule a approval adjustment must pass. Check returns its problems, or none. */
export interface ApprovalAdjustmentRule {
  check(item: ApprovalAdjustment): string[];
}

export class ApprovalAdjustmentJourneyIdLengthRule implements ApprovalAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAdjustment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAdjustmentCodePrefixRule implements ApprovalAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalAdjustmentRequiredLocaleRule implements ApprovalAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAdjustment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAdjustmentTitleLengthRule implements ApprovalAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval adjustment. */
export class ApprovalAdjustmentValidator {
  rules: ApprovalAdjustmentRule[];

  constructor(rules: ApprovalAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalAdjustment): string[] {
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

  requireValid(item: ApprovalAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalAdjustment[]): Map<string, string[]> {
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

export function defaultApprovalAdjustmentValidator(): ApprovalAdjustmentValidator {
  return new ApprovalAdjustmentValidator(
    [
      new ApprovalAdjustmentJourneyIdLengthRule(32),
      new ApprovalAdjustmentCodePrefixRule("X"),
      new ApprovalAdjustmentRequiredLocaleRule("approval adjustment needs this field"),
      new ApprovalAdjustmentTitleLengthRule(16),
    ],
  );
}
