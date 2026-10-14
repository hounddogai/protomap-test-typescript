import { PathMilestone } from "./path-milestone.js";

/** A rule a path milestone must pass. Check returns its problems, or none. */
export interface PathMilestoneRule {
  check(item: PathMilestone): string[];
}

export class PathMilestoneRequiredNameRule implements PathMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PathMilestoneCodePrefixRule implements PathMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathMilestoneDiscountRangeRule implements PathMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathMilestone): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a path milestone. */
export class PathMilestoneValidator {
  rules: PathMilestoneRule[];

  constructor(rules: PathMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PathMilestone): string[] {
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

  requireValid(item: PathMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathMilestone[]): Map<string, string[]> {
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

export function defaultPathMilestoneValidator(): PathMilestoneValidator {
  return new PathMilestoneValidator(
    [
      new PathMilestoneRequiredNameRule("path milestone needs an entry"),
      new PathMilestoneCodePrefixRule("Q"),
      new PathMilestoneDiscountRangeRule(2, 578.9),
    ],
  );
}
