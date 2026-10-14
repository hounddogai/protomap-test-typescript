import { ApprovalSegment } from "./approval-segment.js";

/** A rule a approval segment must pass. Check returns its problems, or none. */
export interface ApprovalSegmentRule {
  check(item: ApprovalSegment): string[];
}

export class ApprovalSegmentRequiredLocaleRule implements ApprovalSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSegment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalSegmentRequiredNameRule implements ApprovalSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalSegmentNameLengthRule implements ApprovalSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval segment. */
export class ApprovalSegmentValidator {
  rules: ApprovalSegmentRule[];

  constructor(rules: ApprovalSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalSegment): string[] {
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

  requireValid(item: ApprovalSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalSegment[]): Map<string, string[]> {
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

export function defaultApprovalSegmentValidator(): ApprovalSegmentValidator {
  return new ApprovalSegmentValidator(
    [
      new ApprovalSegmentRequiredLocaleRule("approval segment needs a value"),
      new ApprovalSegmentRequiredNameRule("approval segment needs an entry"),
      new ApprovalSegmentNameLengthRule(3600),
    ],
  );
}
