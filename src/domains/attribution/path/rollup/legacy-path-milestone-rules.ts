import { LegacyPathMilestone } from "./legacy-path-milestone.js";

/** A rule a legacy path milestone must pass. Check returns its problems, or none. */
export interface LegacyPathMilestoneRule {
  check(item: LegacyPathMilestone): string[];
}

export class LegacyPathMilestoneCodePrefixRule implements LegacyPathMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyPathMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyPathMilestoneRetriesRangeRule implements LegacyPathMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPathMilestone): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPathMilestoneRevisionRangeRule implements LegacyPathMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPathMilestone): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy path milestone. */
export class LegacyPathMilestoneValidator {
  rules: LegacyPathMilestoneRule[];

  constructor(rules: LegacyPathMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPathMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPathMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPathMilestone[]): Map<string, string[]> {
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

export function defaultLegacyPathMilestoneValidator(): LegacyPathMilestoneValidator {
  return new LegacyPathMilestoneValidator(
    [
      new LegacyPathMilestoneCodePrefixRule("ACM"),
      new LegacyPathMilestoneRetriesRangeRule(120, 255),
      new LegacyPathMilestoneRevisionRangeRule(1000, 3600),
    ],
  );
}
