import { PendingCsatMilestone } from "./pending-csat-milestone.js";

/** A rule a pending csat milestone must pass. Check returns its problems, or none. */
export interface PendingCsatMilestoneRule {
  check(item: PendingCsatMilestone): string[];
}

export class PendingCsatMilestoneCodePrefixRule implements PendingCsatMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCsatMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCsatMilestoneRequiredCodeRule implements PendingCsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCsatMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCsatMilestoneTitleLengthRule implements PendingCsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCsatMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending csat milestone. */
export class PendingCsatMilestoneValidator {
  rules: PendingCsatMilestoneRule[];

  constructor(rules: PendingCsatMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCsatMilestone): string[] {
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

  requireValid(item: PendingCsatMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCsatMilestone[]): Map<string, string[]> {
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

export function defaultPendingCsatMilestoneValidator(): PendingCsatMilestoneValidator {
  return new PendingCsatMilestoneValidator(
    [
      new PendingCsatMilestoneCodePrefixRule("ACM"),
      new PendingCsatMilestoneRequiredCodeRule("pending csat milestone needs this field"),
      new PendingCsatMilestoneTitleLengthRule(32),
    ],
  );
}
