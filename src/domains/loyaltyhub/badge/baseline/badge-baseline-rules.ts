import { BadgeBaseline } from "./badge-baseline.js";

/** A rule a badge baseline must pass. Check returns its problems, or none. */
export interface BadgeBaselineRule {
  check(item: BadgeBaseline): string[];
}

export class BadgeBaselineStartsAtRangeRule implements BadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeBaseline): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeBaselineRateRangeRule implements BadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeBaseline): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeBaselineRequiredCodeRule implements BadgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge baseline. */
export class BadgeBaselineValidator {
  rules: BadgeBaselineRule[];

  constructor(rules: BadgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeBaseline[]): Map<string, string[]> {
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

export function defaultBadgeBaselineValidator(): BadgeBaselineValidator {
  return new BadgeBaselineValidator(
    [
      new BadgeBaselineStartsAtRangeRule(120, 255),
      new BadgeBaselineRateRangeRule(5.3, 1434.2),
      new BadgeBaselineRequiredCodeRule("badge baseline needs this field"),
    ],
  );
}
