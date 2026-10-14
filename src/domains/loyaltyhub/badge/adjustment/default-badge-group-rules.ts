import { DefaultBadgeGroup } from "./default-badge-group.js";

/** A rule a default badge group must pass. Check returns its problems, or none. */
export interface DefaultBadgeGroupRule {
  check(item: DefaultBadgeGroup): string[];
}

export class DefaultBadgeGroupRequiredCohortRule implements DefaultBadgeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeGroup): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBadgeGroupRequiredCodeRule implements DefaultBadgeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBadgeGroupRequiredContactEmailRule implements DefaultBadgeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultBadgeGroup): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultBadgeGroupAmountRangeRule implements DefaultBadgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBadgeGroup): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultBadgeGroupScoreRangeRule implements DefaultBadgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBadgeGroup): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultBadgeGroupContactEmailLengthRule implements DefaultBadgeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultBadgeGroup): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default badge group. */
export class DefaultBadgeGroupValidator {
  rules: DefaultBadgeGroupRule[];

  constructor(rules: DefaultBadgeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBadgeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultBadgeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBadgeGroup[]): Map<string, string[]> {
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

export function defaultDefaultBadgeGroupValidator(): DefaultBadgeGroupValidator {
  return new DefaultBadgeGroupValidator(
    [
      new DefaultBadgeGroupRequiredCohortRule("default badge group needs an entry"),
      new DefaultBadgeGroupRequiredCodeRule("default badge group needs an entry"),
      new DefaultBadgeGroupRequiredContactEmailRule("default badge group needs an entry"),
      new DefaultBadgeGroupAmountRangeRule(2.3, 395.7),
      new DefaultBadgeGroupScoreRangeRule(0.3, 719),
      new DefaultBadgeGroupContactEmailLengthRule(86400),
    ],
  );
}
