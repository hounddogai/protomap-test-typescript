import { ReputationGroup } from "./reputation-group.js";

/** A rule a reputation group must pass. Check returns its problems, or none. */
export interface ReputationGroupRule {
  check(item: ReputationGroup): string[];
}

export class ReputationGroupReviewerLengthRule implements ReputationGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationGroup): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationGroupCohortLengthRule implements ReputationGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationGroup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationGroupRequiredCodeRule implements ReputationGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationGroupRequiredLabelRule implements ReputationGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationGroupMarginRangeRule implements ReputationGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationGroup): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reputation group. */
export class ReputationGroupValidator {
  rules: ReputationGroupRule[];

  constructor(rules: ReputationGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationGroup): string[] {
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

  requireValid(item: ReputationGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationGroup[]): Map<string, string[]> {
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

export function defaultReputationGroupValidator(): ReputationGroupValidator {
  return new ReputationGroupValidator(
    [
      new ReputationGroupReviewerLengthRule(80),
      new ReputationGroupCohortLengthRule(80),
      new ReputationGroupRequiredCodeRule("reputation group needs a value"),
      new ReputationGroupRequiredLabelRule("reputation group needs this field"),
      new ReputationGroupMarginRangeRule(6.4, 3274.8),
    ],
  );
}
