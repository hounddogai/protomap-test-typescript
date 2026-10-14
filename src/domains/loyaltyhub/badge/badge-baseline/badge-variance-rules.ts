import { BadgeVariance } from "./badge-variance.js";

/** A rule a badge variance must pass. Check returns its problems, or none. */
export interface BadgeVarianceRule {
  check(item: BadgeVariance): string[];
}

export class BadgeVarianceNameLengthRule implements BadgeVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeVarianceVisibleGuardRule implements BadgeVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BadgeVariance): string[] {
    if (item.visible && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BadgeVarianceRequiredCodeRule implements BadgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeVarianceTitleLengthRule implements BadgeVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeVarianceRequiredTitleRule implements BadgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge variance. */
export class BadgeVarianceValidator {
  rules: BadgeVarianceRule[];

  constructor(rules: BadgeVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeVariance[]): Map<string, string[]> {
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

export function defaultBadgeVarianceValidator(): BadgeVarianceValidator {
  return new BadgeVarianceValidator(
    [
      new BadgeVarianceNameLengthRule(80),
      new BadgeVarianceVisibleGuardRule(0.7),
      new BadgeVarianceRequiredCodeRule("badge variance needs an entry"),
      new BadgeVarianceTitleLengthRule(32),
      new BadgeVarianceRequiredTitleRule("badge variance needs a value"),
    ],
  );
}
