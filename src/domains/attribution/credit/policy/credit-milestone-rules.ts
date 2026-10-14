import { CreditMilestone } from "./credit-milestone.js";

/** A rule a credit milestone must pass. Check returns its problems, or none. */
export interface CreditMilestoneRule {
  check(item: CreditMilestone): string[];
}

export class CreditMilestoneCodePrefixRule implements CreditMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditMilestoneTitleLengthRule implements CreditMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditMilestoneRequiredAudienceIdRule implements CreditMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditMilestone): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit milestone. */
export class CreditMilestoneValidator {
  rules: CreditMilestoneRule[];

  constructor(rules: CreditMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CreditMilestone): string[] {
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

  requireValid(item: CreditMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditMilestone[]): Map<string, string[]> {
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

export function defaultCreditMilestoneValidator(): CreditMilestoneValidator {
  return new CreditMilestoneValidator(
    [
      new CreditMilestoneCodePrefixRule("X"),
      new CreditMilestoneTitleLengthRule(16),
      new CreditMilestoneRequiredAudienceIdRule("credit milestone needs this field"),
    ],
  );
}
