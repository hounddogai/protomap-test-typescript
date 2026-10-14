import { LegacySenderMilestone } from "./legacy-sender-milestone.js";

/** A rule a legacy sender milestone must pass. Check returns its problems, or none. */
export interface LegacySenderMilestoneRule {
  check(item: LegacySenderMilestone): string[];
}

export class LegacySenderMilestoneMarginRangeRule implements LegacySenderMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySenderMilestone): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacySenderMilestoneCodePrefixRule implements LegacySenderMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacySenderMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacySenderMilestoneCodeLengthRule implements LegacySenderMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySenderMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySenderMilestoneCohortLengthRule implements LegacySenderMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySenderMilestone): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySenderMilestoneRequiredCohortRule implements LegacySenderMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySenderMilestone): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy sender milestone. */
export class LegacySenderMilestoneValidator {
  rules: LegacySenderMilestoneRule[];

  constructor(rules: LegacySenderMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySenderMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySenderMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySenderMilestone[]): Map<string, string[]> {
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

export function defaultLegacySenderMilestoneValidator(): LegacySenderMilestoneValidator {
  return new LegacySenderMilestoneValidator(
    [
      new LegacySenderMilestoneMarginRangeRule(4, 1560.9),
      new LegacySenderMilestoneCodePrefixRule("X"),
      new LegacySenderMilestoneCodeLengthRule(32),
      new LegacySenderMilestoneCohortLengthRule(3600),
      new LegacySenderMilestoneRequiredCohortRule("legacy sender milestone needs this field"),
    ],
  );
}
