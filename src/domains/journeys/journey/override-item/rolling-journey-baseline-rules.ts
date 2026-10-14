import { RollingJourneyBaseline } from "./rolling-journey-baseline.js";

/** A rule a rolling journey baseline must pass. Check returns its problems, or none. */
export interface RollingJourneyBaselineRule {
  check(item: RollingJourneyBaseline): string[];
}

export class RollingJourneyBaselineMinimumRangeRule implements RollingJourneyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyBaseline): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingJourneyBaselineRequiredTitleRule implements RollingJourneyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyBaselinePriorityRangeRule implements RollingJourneyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyBaseline): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingJourneyBaselineTitleLengthRule implements RollingJourneyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyBaselineTagsLimitRule implements RollingJourneyBaselineRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingJourneyBaseline): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a rolling journey baseline. */
export class RollingJourneyBaselineValidator {
  rules: RollingJourneyBaselineRule[];

  constructor(rules: RollingJourneyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingJourneyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyBaseline[]): Map<string, string[]> {
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

export function defaultRollingJourneyBaselineValidator(): RollingJourneyBaselineValidator {
  return new RollingJourneyBaselineValidator(
    [
      new RollingJourneyBaselineMinimumRangeRule(1, 986.2),
      new RollingJourneyBaselineRequiredTitleRule("rolling journey baseline needs an entry"),
      new RollingJourneyBaselinePriorityRangeRule(16, 255),
      new RollingJourneyBaselineTitleLengthRule(255),
      new RollingJourneyBaselineTagsLimitRule(32, ["rolling", "tiered", "capped"]),
    ],
  );
}
