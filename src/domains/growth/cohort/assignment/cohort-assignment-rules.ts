import { CohortAssignment } from "./cohort-assignment.js";

/** A rule a cohort assignment must pass. Check returns its problems, or none. */
export interface CohortAssignmentRule {
  check(item: CohortAssignment): string[];
}

export class CohortAssignmentCeilingRangeRule implements CohortAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAssignment): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortAssignmentCodePrefixRule implements CohortAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortAssignmentRequiredSummaryRule implements CohortAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAssignment): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CohortAssignmentCodeLengthRule implements CohortAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortAssignmentRequiredCampaignRefRule implements CohortAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAssignment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort assignment. */
export class CohortAssignmentValidator {
  rules: CohortAssignmentRule[];

  constructor(rules: CohortAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CohortAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortAssignment[]): Map<string, string[]> {
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

export function defaultCohortAssignmentValidator(): CohortAssignmentValidator {
  return new CohortAssignmentValidator(
    [
      new CohortAssignmentCeilingRangeRule(6.8, 656.9),
      new CohortAssignmentCodePrefixRule("ACM"),
      new CohortAssignmentRequiredSummaryRule("cohort assignment needs an entry"),
      new CohortAssignmentCodeLengthRule(86400),
      new CohortAssignmentRequiredCampaignRefRule("cohort assignment needs a value"),
    ],
  );
}
